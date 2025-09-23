<?php
/**
 * Simplified Python LSTM Prediction Bridge
 * Direct integration with real TensorFlow model
 */

class SimpleLSTMBridge {
    private $pythonPath;
    
    public function __construct() {
        $this->pythonPath = 'C:/Python313/python.exe';
    }
    
    /**
     * Get real LSTM prediction
     */
    public function predict($symbol = 'BTCUSDT') {
        $scriptFile = __DIR__ . '/lstm_simple.py';
        $command = sprintf('"%s" "%s" %s', $this->pythonPath, $scriptFile, $symbol);
        
        $output = shell_exec($command . ' 2>&1');
        
        // Look for RESULT: marker
        if (strpos($output, 'RESULT:') !== false) {
            $resultPos = strpos($output, 'RESULT:');
            $jsonPart = substr($output, $resultPos + 7);
            
            // Clean up the JSON part
            $jsonPart = trim($jsonPart);
            $result = json_decode($jsonPart, true);
            
            if ($result && json_last_error() === JSON_ERROR_NONE) {
                return [
                    'success' => true,
                    'data' => $result,
                    'type' => 'Real TensorFlow LSTM',
                    'execution_time' => $this->extractExecutionTime($output)
                ];
            }
        }
        
        return [
            'success' => false,
            'error' => $output,
            'fallback' => [
                'signal' => 'HOLD',
                'confidence' => 0.5,
                'note' => 'LSTM unavailable'
            ]
        ];
    }
    
    /**
     * Extract execution time from output
     */
    private function extractExecutionTime($output) {
        // Look for timing patterns in TensorFlow output
        $lines = explode("\n", $output);
        $totalLines = count($lines);
        return [
            'total_output_lines' => $totalLines,
            'has_tensorflow_info' => strpos($output, 'tensorflow') !== false,
            'has_prediction' => strpos($output, '[PREDICTION]') !== false
        ];
    }
    
    /**
     * Train model
     */
    public function train($symbol = 'BTCUSDT') {
        $command = sprintf(
            '"%s" -c "
import sys, os
sys.path.append(r\'%s\')
os.chdir(r\'%s\')

try:
    from ai_real_lstm_clean import RealLSTMModel
    import json
    
    print(\'Starting training for %s...\')
    model = RealLSTMModel(\'%s\')
    history, stats = model.train()
    
    print(\'SUCCESS:\' + json.dumps({\'training_completed\': True, \'stats\': stats}))
    
except Exception as e:
    print(\'ERROR: \' + str(e))
"',
            $this->pythonPath,
            __DIR__,
            __DIR__,
            $symbol,
            $symbol
        );
        
        $output = shell_exec($command . ' 2>&1');
        
        if (strpos($output, 'SUCCESS:') !== false) {
            return ['success' => true, 'message' => 'Training completed'];
        } else {
            return ['success' => false, 'error' => $output];
        }
    }
    
    /**
     * Check model status
     */
    public function getModelStatus($symbol = 'BTCUSDT') {
        $modelFile = __DIR__ . "/models/lstm_{$symbol}.h5";
        
        return [
            'model_exists' => file_exists($modelFile),
            'model_size' => file_exists($modelFile) ? filesize($modelFile) : 0,
            'last_modified' => file_exists($modelFile) ? date('Y-m-d H:i:s', filemtime($modelFile)) : null,
            'python_path' => $this->pythonPath
        ];
    }
}

// Test if run directly
if (php_sapi_name() === 'cli') {
    echo "🧪 Testing Simple LSTM Bridge\n";
    echo "==============================\n\n";
    
    $bridge = new SimpleLSTMBridge();
    
    // Test model status
    echo "📊 Model Status:\n";
    $status = $bridge->getModelStatus();
    print_r($status);
    echo "\n";
    
    // Test prediction
    echo "🎯 Getting Prediction:\n";
    $prediction = $bridge->predict();
    print_r($prediction);
    echo "\n";
    
    echo "✅ Test complete!\n";
}
?>