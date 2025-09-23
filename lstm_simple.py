#!/usr/bin/env python3
"""
WinTrades Real LSTM Neural Network (Windows Compatible)
Simple version without emoji characters for PHP bridge compatibility
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

class RealLSTMModelSimple:
    """Real LSTM Model without emoji for Windows compatibility"""
    
    def __init__(self, symbol='BTCUSDT', sequence_length=60):
        self.symbol = symbol
        self.sequence_length = sequence_length
        self.model = None
        self.scaler = MinMaxScaler()
        self.feature_scaler = StandardScaler()
        
        self.model_config = {
            'lstm_units': [50, 50, 25],
            'dropout_rate': 0.2,
            'dense_units': [25, 1],
            'learning_rate': 0.001,
            'batch_size': 32,
            'epochs': 100
        }
        
        self.features = [
            'open', 'high', 'low', 'close', 'volume',
            'rsi', 'macd', 'macd_signal', 'bollinger_upper', 
            'bollinger_lower', 'sma_20', 'ema_12', 'ema_26'
        ]
        
        print(f"[INIT] Real LSTM Model for {symbol} ready")
    
    def calculate_technical_indicators(self, df):
        """Calculate real technical indicators"""
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
        
        # Rename columns
        df.rename(columns={
            'Open': 'open', 'High': 'high', 'Low': 'low', 
            'Close': 'close', 'Volume': 'volume'
        }, inplace=True)
        
        return df
    
    def fetch_and_prepare_data(self, period='2y', interval='1h'):
        """Fetch real market data"""
        print(f"[DATA] Fetching {period} of {interval} data for {self.symbol}")
        
        ticker = yf.Ticker(self.symbol.replace('USDT', '-USD'))
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            raise ValueError(f"No data found for {self.symbol}")
        
        print(f"[DATA] Downloaded {len(df)} data points")
        
        df = self.calculate_technical_indicators(df)
        df = df.dropna()
        
        print(f"[DATA] After preprocessing: {len(df)} samples")
        return df
    
    def create_sequences(self, data, target_col='close'):
        """Create sequences for LSTM"""
        feature_data = data[self.features].values
        target_data = data[target_col].values
        
        feature_data_scaled = self.feature_scaler.fit_transform(feature_data)
        target_data_scaled = self.scaler.fit_transform(target_data.reshape(-1, 1)).flatten()
        
        X, y = [], []
        for i in range(self.sequence_length, len(feature_data_scaled)):
            X.append(feature_data_scaled[i-self.sequence_length:i])
            
            current_price = target_data[i]
            previous_price = target_data[i-1]
            y.append(1 if current_price > previous_price else 0)
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"[SEQUENCES] Created X shape {X.shape}, y shape {y.shape}")
        return X, y
    
    def build_model(self, input_shape):
        """Build LSTM architecture"""
        model = Sequential()
        
        model.add(LSTM(
            units=self.model_config['lstm_units'][0],
            return_sequences=True,
            input_shape=input_shape,
            dropout=self.model_config['dropout_rate'],
            recurrent_dropout=self.model_config['dropout_rate']
        ))
        model.add(BatchNormalization())
        
        model.add(LSTM(
            units=self.model_config['lstm_units'][1],
            return_sequences=True,
            dropout=self.model_config['dropout_rate'],
            recurrent_dropout=self.model_config['dropout_rate']
        ))
        model.add(BatchNormalization())
        
        model.add(LSTM(
            units=self.model_config['lstm_units'][2],
            dropout=self.model_config['dropout_rate'],
            recurrent_dropout=self.model_config['dropout_rate']
        ))
        model.add(BatchNormalization())
        
        model.add(Dense(self.model_config['dense_units'][0], activation='relu'))
        model.add(Dropout(self.model_config['dropout_rate']))
        model.add(Dense(self.model_config['dense_units'][1], activation='sigmoid'))
        
        model.compile(
            optimizer=Adam(learning_rate=self.model_config['learning_rate']),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        print("[MODEL] LSTM architecture built")
        return model
    
    def predict(self, recent_data=None):
        """Make real predictions"""
        if self.model is None:
            self.load_model()
        
        if recent_data is None:
            df = self.fetch_and_prepare_data(period='60d', interval='1h')
            recent_data = df.tail(self.sequence_length)
        
        feature_data = recent_data[self.features].values
        feature_data_scaled = self.feature_scaler.transform(feature_data)
        
        X = feature_data_scaled.reshape(1, self.sequence_length, len(self.features))
        prediction = self.model.predict(X, verbose=0)[0][0]
        
        confidence = abs(prediction - 0.5) * 2
        
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
        
        print(f"[PREDICTION] {signal} with {confidence:.2%} confidence")
        return result
    
    def load_model(self):
        """Load trained model"""
        try:
            self.model = load_model(f'models/lstm_{self.symbol}.h5')
            self.scaler = joblib.load(f'models/scaler_{self.symbol}.pkl')
            self.feature_scaler = joblib.load(f'models/feature_scaler_{self.symbol}.pkl')
            print(f"[LOAD] Model loaded for {self.symbol}")
            return True
        except Exception as e:
            print(f"[ERROR] Could not load model: {e}")
            return False

def get_lstm_prediction(symbol='BTCUSDT'):
    """Simple function to get prediction"""
    try:
        model = RealLSTMModelSimple(symbol)
        if model.load_model():
            return model.predict()
        else:
            return {'error': 'Model not found'}
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'BTCUSDT'
    
    result = get_lstm_prediction(symbol)
    print("RESULT:" + json.dumps(result))