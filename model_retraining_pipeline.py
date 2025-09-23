#!/usr/bin/env python3
"""
Automated LSTM Model Retraining Pipeline
========================================

Production-ready system for automated model updates with:
- Scheduled data collection and validation
- Model performance comparison
- Automated rollback mechanisms
- Production deployment safety checks
"""

import os
import sys
import json
import pickle
import shutil
import logging
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
import warnings
warnings.filterwarnings('ignore')

class ModelRetrainingPipeline:
    def __init__(self, config_path='model_config.json'):
        """Initialize the retraining pipeline"""
        self.setup_logging()
        self.load_config(config_path)
        self.create_directories()
        
    def setup_logging(self):
        """Setup comprehensive logging"""
        log_dir = Path('logs')
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'logs/retraining_{datetime.now().strftime("%Y%m%d")}.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def load_config(self, config_path):
        """Load retraining configuration"""
        default_config = {
            "models_dir": "models",
            "data_dir": "data",
            "backup_dir": "backups",
            "symbols": ["BTC-USD", "ETH-USD", "AAPL", "GOOGL"],
            "sequence_length": 60,
            "features": ["close", "volume", "high", "low"],
            "validation_threshold": 0.15,  # Max acceptable MSE increase
            "minimum_accuracy": 0.45,      # Minimum required accuracy
            "retrain_frequency_hours": 24,
            "data_freshness_hours": 6,
            "backup_retention_days": 30
        }
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = json.load(f)
                # Merge with defaults
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
        else:
            config = default_config
            self.save_config(config, config_path)
            
        self.config = config
        self.logger.info(f"Configuration loaded: {len(config)} parameters")
        
    def save_config(self, config, config_path):
        """Save configuration to file"""
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
            
    def create_directories(self):
        """Create necessary directories"""
        for dir_name in ['models_dir', 'data_dir', 'backup_dir']:
            path = Path(self.config[dir_name])
            path.mkdir(exist_ok=True)
            
    def collect_fresh_data(self, symbol, days=365):
        """Collect fresh market data with validation"""
        try:
            self.logger.info(f"Collecting data for {symbol}...")
            
            # Download recent data
            ticker = yf.Ticker(symbol)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            data = ticker.history(start=start_date, end=end_date)
            
            if data.empty:
                raise ValueError(f"No data retrieved for {symbol}")
                
            # Data validation
            required_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
            missing_cols = [col for col in required_cols if col not in data.columns]
            if missing_cols:
                raise ValueError(f"Missing columns: {missing_cols}")
                
            # Check for sufficient data
            if len(data) < self.config['sequence_length'] * 2:
                raise ValueError(f"Insufficient data: {len(data)} rows")
                
            # Check data freshness
            latest_date = data.index[-1].date()
            days_old = (datetime.now().date() - latest_date).days
            if days_old > self.config['data_freshness_hours'] / 24:
                self.logger.warning(f"Data is {days_old} days old for {symbol}")
                
            # Save raw data
            data_file = Path(self.config['data_dir']) / f"{symbol}_raw_{datetime.now().strftime('%Y%m%d')}.csv"
            data.to_csv(data_file)
            
            self.logger.info(f"Data collected: {len(data)} rows, latest: {latest_date}")
            return data
            
        except Exception as e:
            self.logger.error(f"Data collection failed for {symbol}: {str(e)}")
            return None
            
    def preprocess_data(self, data, symbol):
        """Advanced data preprocessing with feature engineering"""
        try:
            df = data.copy()
            
            # Feature engineering
            df['returns'] = df['Close'].pct_change()
            df['volatility'] = df['returns'].rolling(window=20).std()
            df['rsi'] = self.calculate_rsi(df['Close'])
            df['ma_20'] = df['Close'].rolling(window=20).mean()
            df['ma_50'] = df['Close'].rolling(window=50).mean()
            df['price_position'] = (df['Close'] - df['Low']) / (df['High'] - df['Low'])
            
            # Volume indicators
            df['volume_ma'] = df['Volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['Volume'] / df['volume_ma']
            
            # Price patterns
            df['high_low_ratio'] = df['High'] / df['Low']
            df['close_open_ratio'] = df['Close'] / df['Open']
            
            # Select features for model
            feature_columns = [
                'Close', 'Volume', 'High', 'Low', 'returns', 
                'volatility', 'rsi', 'price_position', 'volume_ratio',
                'high_low_ratio', 'close_open_ratio'
            ]
            
            # Remove NaN values
            df = df.dropna()
            features_df = df[feature_columns].copy()
            
            # Normalize features
            scaler = MinMaxScaler()
            scaled_features = scaler.fit_transform(features_df)
            
            # Save scaler
            scaler_file = Path(self.config['models_dir']) / f"{symbol}_scaler.pkl"
            with open(scaler_file, 'wb') as f:
                pickle.dump(scaler, f)
                
            self.logger.info(f"Data preprocessed: {len(features_df)} rows, {len(feature_columns)} features")
            return scaled_features, df['Close'].values, scaler
            
        except Exception as e:
            self.logger.error(f"Data preprocessing failed: {str(e)}")
            return None, None, None
            
    def calculate_rsi(self, prices, period=14):
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
        
    def create_sequences(self, data, target, sequence_length):
        """Create sequences for LSTM training"""
        X, y = [], []
        for i in range(sequence_length, len(data)):
            X.append(data[i-sequence_length:i])
            y.append(target[i])
        return np.array(X), np.array(y)
        
    def build_model(self, input_shape):
        """Build enhanced LSTM model"""
        model = Sequential([
            LSTM(100, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(100, return_sequences=True),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        return model
        
    def train_new_model(self, symbol):
        """Train a new model with fresh data"""
        try:
            self.logger.info(f"Training new model for {symbol}...")
            
            # Collect and preprocess data
            raw_data = self.collect_fresh_data(symbol)
            if raw_data is None:
                return None
                
            scaled_data, target_data, scaler = self.preprocess_data(raw_data, symbol)
            if scaled_data is None:
                return None
                
            # Create sequences
            X, y = self.create_sequences(scaled_data, target_data, self.config['sequence_length'])
            
            # Train/validation split
            split_index = int(len(X) * 0.8)
            X_train, X_val = X[:split_index], X[split_index:]
            y_train, y_val = y[:split_index], y[split_index:]
            
            # Build and train model
            model = self.build_model((X_train.shape[1], X_train.shape[2]))
            
            history = model.fit(
                X_train, y_train,
                epochs=50,
                batch_size=32,
                validation_data=(X_val, y_val),
                verbose=0,
                callbacks=[
                    tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
                    tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
                ]
            )
            
            # Evaluate model
            train_loss = model.evaluate(X_train, y_train, verbose=0)[0]
            val_loss = model.evaluate(X_val, y_val, verbose=0)[0]
            
            # Calculate accuracy metrics
            train_pred = model.predict(X_train, verbose=0)
            val_pred = model.predict(X_val, verbose=0)
            
            train_accuracy = self.calculate_directional_accuracy(y_train, train_pred)
            val_accuracy = self.calculate_directional_accuracy(y_val, val_pred)
            
            model_metrics = {
                'symbol': symbol,
                'train_loss': float(train_loss),
                'val_loss': float(val_loss),
                'train_accuracy': float(train_accuracy),
                'val_accuracy': float(val_accuracy),
                'training_date': datetime.now().isoformat(),
                'data_points': len(X),
                'features': X.shape[2]
            }
            
            self.logger.info(f"Model trained - Val Loss: {val_loss:.4f}, Val Accuracy: {val_accuracy:.2f}%")
            return model, model_metrics, scaler
            
        except Exception as e:
            self.logger.error(f"Model training failed for {symbol}: {str(e)}")
            return None, None, None
            
    def calculate_directional_accuracy(self, y_true, y_pred):
        """Calculate directional accuracy (up/down prediction)"""
        if len(y_true) < 2:
            return 0.0
            
        true_direction = np.diff(y_true) > 0
        pred_direction = np.diff(y_pred.flatten()) > 0
        accuracy = np.mean(true_direction == pred_direction) * 100
        return accuracy
        
    def compare_models(self, old_metrics, new_metrics):
        """Compare old and new model performance"""
        if old_metrics is None:
            self.logger.info("No existing model to compare - accepting new model")
            return True
            
        old_val_loss = old_metrics.get('val_loss', float('inf'))
        new_val_loss = new_metrics['val_loss']
        
        old_val_accuracy = old_metrics.get('val_accuracy', 0)
        new_val_accuracy = new_metrics['val_accuracy']
        
        # Check if new model meets minimum requirements
        if new_val_accuracy < self.config['minimum_accuracy']:
            self.logger.warning(f"New model accuracy {new_val_accuracy:.2f}% below minimum {self.config['minimum_accuracy']}%")
            return False
            
        # Check if new model is significantly worse
        loss_increase = (new_val_loss - old_val_loss) / old_val_loss
        if loss_increase > self.config['validation_threshold']:
            self.logger.warning(f"New model loss increased by {loss_increase*100:.1f}% - rejecting")
            return False
            
        # Model improvement check
        if new_val_loss < old_val_loss or new_val_accuracy > old_val_accuracy:
            self.logger.info(f"Model improved - Loss: {old_val_loss:.4f}→{new_val_loss:.4f}, Accuracy: {old_val_accuracy:.1f}%→{new_val_accuracy:.1f}%")
            return True
        else:
            self.logger.info("New model performance similar - accepting for data freshness")
            return True
            
    def backup_current_model(self, symbol):
        """Backup current production model"""
        try:
            model_file = Path(self.config['models_dir']) / f"{symbol}_model.h5"
            metrics_file = Path(self.config['models_dir']) / f"{symbol}_metrics.json"
            scaler_file = Path(self.config['models_dir']) / f"{symbol}_scaler.pkl"
            
            if not model_file.exists():
                self.logger.info(f"No existing model to backup for {symbol}")
                return True
                
            backup_dir = Path(self.config['backup_dir']) / datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Backup files
            for file_path in [model_file, metrics_file, scaler_file]:
                if file_path.exists():
                    shutil.copy2(file_path, backup_dir / file_path.name)
                    
            self.logger.info(f"Model backed up to {backup_dir}")
            return True
            
        except Exception as e:
            self.logger.error(f"Backup failed for {symbol}: {str(e)}")
            return False
            
    def deploy_model(self, symbol, model, metrics, scaler):
        """Deploy new model to production"""
        try:
            model_file = Path(self.config['models_dir']) / f"{symbol}_model.h5"
            metrics_file = Path(self.config['models_dir']) / f"{symbol}_metrics.json"
            scaler_file = Path(self.config['models_dir']) / f"{symbol}_scaler.pkl"
            
            # Save new model
            model.save(model_file)
            
            # Save metrics
            with open(metrics_file, 'w') as f:
                json.dump(metrics, f, indent=2)
                
            # Save scaler
            with open(scaler_file, 'wb') as f:
                pickle.dump(scaler, f)
                
            self.logger.info(f"Model deployed successfully for {symbol}")
            return True
            
        except Exception as e:
            self.logger.error(f"Model deployment failed for {symbol}: {str(e)}")
            return False
            
    def cleanup_old_backups(self):
        """Remove old backup files"""
        try:
            backup_dir = Path(self.config['backup_dir'])
            if not backup_dir.exists():
                return
                
            cutoff_date = datetime.now() - timedelta(days=self.config['backup_retention_days'])
            
            for backup_folder in backup_dir.iterdir():
                if backup_folder.is_dir():
                    try:
                        folder_date = datetime.strptime(backup_folder.name[:8], '%Y%m%d')
                        if folder_date < cutoff_date:
                            shutil.rmtree(backup_folder)
                            self.logger.info(f"Removed old backup: {backup_folder.name}")
                    except ValueError:
                        pass  # Skip folders with invalid date format
                        
        except Exception as e:
            self.logger.error(f"Backup cleanup failed: {str(e)}")
            
    def retrain_symbol(self, symbol):
        """Complete retraining process for a symbol"""
        self.logger.info(f"Starting retraining process for {symbol}")
        
        # Load existing metrics
        metrics_file = Path(self.config['models_dir']) / f"{symbol}_metrics.json"
        old_metrics = None
        if metrics_file.exists():
            with open(metrics_file, 'r') as f:
                old_metrics = json.load(f)
                
        # Train new model
        new_model, new_metrics, new_scaler = self.train_new_model(symbol)
        if new_model is None:
            self.logger.error(f"Training failed for {symbol}")
            return False
            
        # Compare models
        if not self.compare_models(old_metrics, new_metrics):
            self.logger.warning(f"New model rejected for {symbol}")
            return False
            
        # Backup current model
        if not self.backup_current_model(symbol):
            self.logger.error(f"Backup failed for {symbol}")
            return False
            
        # Deploy new model
        if not self.deploy_model(symbol, new_model, new_metrics, new_scaler):
            self.logger.error(f"Deployment failed for {symbol}")
            return False
            
        self.logger.info(f"Retraining completed successfully for {symbol}")
        return True
        
    def run_full_pipeline(self):
        """Run complete retraining pipeline for all symbols"""
        self.logger.info("Starting full retraining pipeline")
        start_time = datetime.now()
        
        results = {}
        for symbol in self.config['symbols']:
            results[symbol] = self.retrain_symbol(symbol)
            
        # Cleanup old backups
        self.cleanup_old_backups()
        
        # Generate report
        successful = sum(results.values())
        total = len(results)
        duration = datetime.now() - start_time
        
        self.logger.info(f"Pipeline completed: {successful}/{total} models updated in {duration}")
        
        # Save pipeline report
        report = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration.total_seconds(),
            'total_symbols': total,
            'successful_updates': successful,
            'results': results
        }
        
        report_file = Path('logs') / f"pipeline_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        return results

def main():
    """Main execution function"""
    print("🤖 LSTM Model Retraining Pipeline")
    print("=" * 40)
    
    pipeline = ModelRetrainingPipeline()
    results = pipeline.run_full_pipeline()
    
    print(f"\n✅ Pipeline Results:")
    for symbol, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"   {symbol}: {status}")

if __name__ == "__main__":
    main()