import sys, os
sys.path.append(r'C:\xampp\htdocs\wintradesgo')
os.chdir(r'C:\xampp\htdocs\wintradesgo')

try:
    from ai_real_lstm_clean import RealLSTMModel
    import json
    
    print("Creating model...")
    model = RealLSTMModel('BTCUSDT')
    
    print("Loading model...")
    if model.load_model():
        print("Getting prediction...")
        prediction = model.predict()
        
        print("SUCCESS:" + json.dumps(prediction))
    else:
        print("ERROR: Model not found")
        
except Exception as e:
    print("ERROR: " + str(e))
    import traceback
    traceback.print_exc()