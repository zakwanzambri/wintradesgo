#!/usr/bin/env python3
"""
WinTrades Real LSTM Neural Network
Replaces the PHP simulation with actual TensorFlow machine learning

This is a REAL LSTM implementation with:
- Actual neural network training
- Real gradient descent optimization
- Proper data preprocessing
- Model persistence
- Validation metrics
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import yfinance as yf
import joblib
import os
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class RealLSTMModel:
    """
    Professional LSTM Neural Network for Trading Predictions
    
    Features:
    - Real TensorFlow implementation (not simulation)
    - Proper train/validation/test splits
    - Feature engineering with technical indicators
    - Model persistence and versioning
    - Comprehensive evaluation metrics
    """
    
    def __init__(self, symbol='BTCUSDT', sequence_length=60):
        self.symbol = symbol
        self.sequence_length = sequence_length
        self.model = None
        self.scaler = MinMaxScaler()
        self.feature_scaler = StandardScaler()
        
        # Model configuration
        self.model_config = {
            'lstm_units': [50, 50, 25],
            'dropout_rate': 0.2,
            'dense_units': [25, 1],
            'learning_rate': 0.001,
            'batch_size': 32,
            'epochs': 100
        }
        
        # Feature configuration
        self.features = [
            'open', 'high', 'low', 'close', 'volume',
            'rsi', 'macd', 'macd_signal', 'bollinger_upper', 
            'bollinger_lower', 'sma_20', 'ema_12', 'ema_26'
        ]
        
        print(f"🧠 Initialized Real LSTM Model for {symbol}")
        print(f"📊 Sequence Length: {sequence_length}")
        print(f"🔧 Features: {len(self.features)}")
    
    def calculate_technical_indicators(self, df):
        """
        Calculate real technical indicators (not simulated)
        """
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        ema12 = df['Close'].ewm(span=12).mean()
        ema26 = df['Close'].ewm(span=26).mean()
        df['macd'] = ema12 - ema26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        
        # Bollinger Bands
        sma20 = df['Close'].rolling(window=20).mean()
        std20 = df['Close'].rolling(window=20).std()
        df['bollinger_upper'] = sma20 + (2 * std20)
        df['bollinger_lower'] = sma20 - (2 * std20)
        df['sma_20'] = sma20
        
        # EMAs
        df['ema_12'] = ema12
        df['ema_26'] = ema26
        
        # Rename columns to match feature list
        df.rename(columns={
            'Open': 'open', 'High': 'high', 'Low': 'low', 
            'Close': 'close', 'Volume': 'volume'
        }, inplace=True)
        
        return df
    
    def fetch_and_prepare_data(self, period='2y', interval='1h'):
        """
        Fetch real market data and prepare features
        """
        print(f"📡 Fetching {period} of {interval} data for {self.symbol}...")
        
        # Fetch real data from Yahoo Finance
        ticker = yf.Ticker(self.symbol.replace('USDT', '-USD'))
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            raise ValueError(f"No data found for {self.symbol}")
        
        print(f"✅ Downloaded {len(df)} data points")
        
        # Calculate technical indicators
        df = self.calculate_technical_indicators(df)
        
        # Remove NaN values
        df = df.dropna()
        
        print(f"📊 After preprocessing: {len(df)} samples")
        return df
    
    def create_sequences(self, data, target_col='close'):
        """
        Create sequences for LSTM training
        """
        # Prepare features
        feature_data = data[self.features].values
        target_data = data[target_col].values
        
        # Normalize features
        feature_data_scaled = self.feature_scaler.fit_transform(feature_data)
        target_data_scaled = self.scaler.fit_transform(target_data.reshape(-1, 1)).flatten()
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(feature_data_scaled)):
            X.append(feature_data_scaled[i-self.sequence_length:i])
            
            # Create binary classification target
            # 1 if price goes up, 0 if price goes down
            current_price = target_data[i]
            previous_price = target_data[i-1]
            y.append(1 if current_price > previous_price else 0)
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"🔢 Created sequences: X shape {X.shape}, y shape {y.shape}")
        return X, y
    
    def build_model(self, input_shape):
        """
        Build real LSTM neural network architecture
        """
        model = Sequential()
        
        # First LSTM layer
        model.add(LSTM(
            units=self.model_config['lstm_units'][0],
            return_sequences=True,
            input_shape=input_shape,
            dropout=self.model_config['dropout_rate'],
            recurrent_dropout=self.model_config['dropout_rate']
        ))
        model.add(BatchNormalization())
        
        # Second LSTM layer
        model.add(LSTM(
            units=self.model_config['lstm_units'][1],
            return_sequences=True,
            dropout=self.model_config['dropout_rate'],
            recurrent_dropout=self.model_config['dropout_rate']
        ))
        model.add(BatchNormalization())
        
        # Third LSTM layer
        model.add(LSTM(
            units=self.model_config['lstm_units'][2],
            dropout=self.model_config['dropout_rate'],
            recurrent_dropout=self.model_config['dropout_rate']
        ))
        model.add(BatchNormalization())
        
        # Dense layers
        model.add(Dense(self.model_config['dense_units'][0], activation='relu'))
        model.add(Dropout(self.model_config['dropout_rate']))
        model.add(Dense(self.model_config['dense_units'][1], activation='sigmoid'))
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=self.model_config['learning_rate']),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        print("🏗️  Built LSTM model architecture:")
        model.summary()
        
        return model
    
    def train(self, validation_split=0.2, test_split=0.1):
        """
        Train the real LSTM model with proper validation
        """
        print(f"\n🚀 Starting real LSTM training for {self.symbol}...")
        
        # Fetch and prepare data
        df = self.fetch_and_prepare_data()
        X, y = self.create_sequences(df)
        
        # Split data
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_split, random_state=42, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=validation_split/(1-test_split), 
            random_state=42, stratify=y_temp
        )
        
        print(f"📊 Training set: {X_train.shape[0]} samples")
        print(f"📊 Validation set: {X_val.shape[0]} samples")
        print(f"📊 Test set: {X_test.shape[0]} samples")
        
        # Build model
        self.model = self.build_model(input_shape=(X.shape[1], X.shape[2]))
        
        # Setup callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_accuracy', 
                patience=10, 
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                filepath=f'models/{self.symbol}_lstm_best.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=0.00001,
                verbose=1
            )
        ]
        
        # Create models directory
        os.makedirs('models', exist_ok=True)
        
        # Train model
        print("\n🔥 Training neural network...")
        start_time = datetime.now()
        
        history = self.model.fit(
            X_train, y_train,
            batch_size=self.model_config['batch_size'],
            epochs=self.model_config['epochs'],
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        training_time = datetime.now() - start_time
        print(f"⏱️  Training completed in: {training_time}")
        
        # Evaluate on test set
        print("\n📊 Evaluating on test set...")
        test_loss, test_accuracy, test_precision, test_recall = self.model.evaluate(
            X_test, y_test, verbose=0
        )
        
        # Generate predictions for detailed metrics
        y_pred = self.model.predict(X_test)
        y_pred_binary = (y_pred > 0.5).astype(int).flatten()
        
        # Print detailed results
        print(f"\n✅ Test Results:")
        print(f"   📈 Accuracy: {test_accuracy:.4f}")
        print(f"   📈 Precision: {test_precision:.4f}")
        print(f"   📈 Recall: {test_recall:.4f}")
        print(f"   📈 Loss: {test_loss:.4f}")
        
        print("\n📋 Classification Report:")
        print(classification_report(y_test, y_pred_binary, 
                                  target_names=['Sell', 'Buy']))
        
        print("\n🔍 Confusion Matrix:")
        print(confusion_matrix(y_test, y_pred_binary))
        
        # Save model
        self.save_model()
        
        # Return training results
        return history, {
            'test_accuracy': test_accuracy,
            'test_precision': test_precision,
            'test_recall': test_recall,
            'test_loss': test_loss,
            'training_time': training_time.total_seconds(),
            'total_samples': len(X),
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'test_samples': len(X_test)
        }
        
        # Split data: train/validation/test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_split, random_state=42, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=validation_split/(1-test_split), 
            random_state=42, stratify=y_temp
        )
        
        print(f"📊 Data splits:")
        print(f"   Training: {X_train.shape[0]} samples")
        print(f"   Validation: {X_val.shape[0]} samples")
        print(f"   Test: {X_test.shape[0]} samples")
        
        # Build model
        self.model = self.build_model((X.shape[1], X.shape[2]))
        
        # Setup callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                f'models/lstm_{self.symbol}_best.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=8,
                min_lr=0.0001,
                verbose=1
            )
        ]
        
        # Create models directory
        os.makedirs('models', exist_ok=True)
        
        # Train the model
        print("\n🔥 Training neural network...")
        history = self.model.fit(
            X_train, y_train,
            batch_size=self.model_config['batch_size'],
            epochs=self.model_config['epochs'],
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate on test set
        print("\n📊 Evaluating on test set...")
        test_loss, test_accuracy, test_precision, test_recall = self.model.evaluate(
            X_test, y_test, verbose=0
        )
        
        # Make predictions for detailed metrics
        y_pred = (self.model.predict(X_test) > 0.5).astype(int)
        
        print(f"\n✅ Training Complete!")
        print(f"📊 Test Metrics:")
        print(f"   Accuracy: {test_accuracy:.4f}")
        print(f"   Precision: {test_precision:.4f}")
        print(f"   Recall: {test_recall:.4f}")
        print(f"   Loss: {test_loss:.4f}")
        
        print(f"\n📈 Detailed Classification Report:")
        print(classification_report(y_test, y_pred))
        
        # Save model and scalers
        self.save_model()
        
        # Save training history
        training_stats = {
            'symbol': self.symbol,
            'training_date': datetime.now().isoformat(),
            'test_accuracy': float(test_accuracy),
            'test_precision': float(test_precision),
            'test_recall': float(test_recall),
            'test_loss': float(test_loss),
            'training_samples': int(X_train.shape[0]),
            'validation_samples': int(X_val.shape[0]),
            'test_samples': int(X_test.shape[0]),
            'model_config': self.model_config,
            'features': self.features
        }
        
        with open(f'models/training_stats_{self.symbol}.json', 'w') as f:
            json.dump(training_stats, f, indent=2)
        
        return history, training_stats
    
    def predict(self, recent_data=None):
        """
        Make real predictions using trained model
        """
        if self.model is None:
            self.load_model()
        
        if recent_data is None:
            # Fetch recent data
            df = self.fetch_and_prepare_data(period='60d', interval='1h')
            recent_data = df.tail(self.sequence_length)
        
        # Prepare features
        feature_data = recent_data[self.features].values
        feature_data_scaled = self.feature_scaler.transform(feature_data)
        
        # Reshape for prediction
        X = feature_data_scaled.reshape(1, self.sequence_length, len(self.features))
        
        # Make prediction
        prediction = self.model.predict(X, verbose=0)[0][0]
        
        # Get confidence level
        confidence = abs(prediction - 0.5) * 2  # Convert to 0-1 scale
        
        # Determine signal
        if prediction > 0.6:
            signal = 'BUY'
        elif prediction < 0.4:
            signal = 'SELL'
        else:
            signal = 'HOLD'
        
        result = {
            'symbol': self.symbol,
            'prediction_raw': float(prediction),
            'signal': signal,
            'confidence': float(confidence),
            'timestamp': datetime.now().isoformat(),
            'model_type': 'Real LSTM TensorFlow'
        }
        
        print(f"🎯 Real LSTM Prediction for {self.symbol}:")
        print(f"   Signal: {signal}")
        print(f"   Confidence: {confidence:.2%}")
        print(f"   Raw Score: {prediction:.4f}")
        
        return result
    
    def save_model(self):
        """
        Save trained model and scalers
        """
        os.makedirs('models', exist_ok=True)
        
        # Save model
        self.model.save(f'models/lstm_{self.symbol}.h5')
        
        # Save scalers
        joblib.dump(self.scaler, f'models/scaler_{self.symbol}.pkl')
        joblib.dump(self.feature_scaler, f'models/feature_scaler_{self.symbol}.pkl')
        
        print(f"💾 Saved model and scalers for {self.symbol}")
    
    def load_model(self):
        """
        Load pre-trained model and scalers
        """
        try:
            self.model = load_model(f'models/lstm_{self.symbol}.h5')
            self.scaler = joblib.load(f'models/scaler_{self.symbol}.pkl')
            self.feature_scaler = joblib.load(f'models/feature_scaler_{self.symbol}.pkl')
            print(f"✅ Loaded trained model for {self.symbol}")
            return True
        except Exception as e:
            print(f"❌ Could not load model: {e}")
            return False

def test_real_lstm():
    """
    Test the real LSTM implementation
    """
    print("🧪 Testing Real LSTM Implementation")
    print("=" * 50)
    
    # Create model
    lstm_model = RealLSTMModel('BTCUSDT')
    
    # Train model (comment out if model already exists)
    print("\n🔥 Training new model...")
    history, stats = lstm_model.train()
    
    # Make prediction
    print("\n🎯 Making prediction...")
    prediction = lstm_model.predict()
    
    print("\n✅ Real LSTM Test Complete!")
    return prediction

if __name__ == "__main__":
    # Test the real LSTM model
    test_real_lstm()