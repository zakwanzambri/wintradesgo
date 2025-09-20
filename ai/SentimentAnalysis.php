<?php
/**
 * Sentiment Analysis System
 * Analyzes news sentiment and social media trends for trading signals
 */

class SentimentAnalysis {
    
    private $newsApiKey = ''; // Add your NewsAPI key here
    private $positiveKeywords = [
        'bullish', 'surge', 'rally', 'breakout', 'pump', 'moon', 'bullrun', 
        'adoption', 'partnership', 'upgrade', 'innovation', 'breakthrough',
        'growth', 'profit', 'gain', 'rocket', 'explosive', 'institutional',
        'investment', 'whale', 'accumulation', 'optimistic', 'positive'
    ];
    
    private $negativeKeywords = [
        'bearish', 'crash', 'dump', 'sell-off', 'decline', 'drop', 'fall',
        'fear', 'panic', 'correction', 'bearmarket', 'recession', 'bubble',
        'regulation', 'ban', 'hack', 'scam', 'rug', 'liquidation',
        'pessimistic', 'negative', 'concern', 'warning', 'risk', 'volatile'
    ];
    
    private $neutralKeywords = [
        'analysis', 'review', 'update', 'report', 'consolidation', 'stable',
        'sideways', 'range', 'observation', 'watching', 'monitoring'
    ];
    
    /**
     * Get cryptocurrency news sentiment
     * @param string $symbol Cryptocurrency symbol (BTC, ETH, etc.)
     * @param int $hours Hours to look back for news (default 24)
     * @return array Sentiment analysis result
     */
    public function getCryptoNewsSentiment($symbol, $hours = 24) {
        // Multiple news sources for better coverage
        $sources = [
            $this->getCoinDeskNews($symbol, $hours),
            $this->getCryptoNewsAPI($symbol, $hours),
            $this->getRedditSentiment($symbol, $hours)
        ];
        
        $allArticles = [];
        foreach ($sources as $sourceArticles) {
            if ($sourceArticles) {
                $allArticles = array_merge($allArticles, $sourceArticles);
            }
        }
        
        if (empty($allArticles)) {
            return $this->getDefaultSentiment();
        }
        
        return $this->analyzeSentiment($allArticles, $symbol);
    }
    
    /**
     * Analyze sentiment from text articles
     * @param array $articles Array of article texts
     * @param string $symbol Cryptocurrency symbol
     * @return array Sentiment analysis result
     */
    private function analyzeSentiment($articles, $symbol) {
        $totalArticles = count($articles);
        $positiveCount = 0;
        $negativeCount = 0;
        $neutralCount = 0;
        $sentimentScores = [];
        
        foreach ($articles as $article) {
            $text = strtolower($article['title'] . ' ' . $article['description']);
            $score = $this->calculateSentimentScore($text);
            $sentimentScores[] = $score;
            
            if ($score > 0.1) {
                $positiveCount++;
            } elseif ($score < -0.1) {
                $negativeCount++;
            } else {
                $neutralCount++;
            }
        }
        
        $avgSentiment = array_sum($sentimentScores) / count($sentimentScores);
        $sentimentStrength = abs($avgSentiment) * 100;
        
        // Calculate sentiment signal
        if ($avgSentiment > 0.2) {
            $sentimentSignal = 'BULLISH';
            $confidence = min(90, 60 + $sentimentStrength);
        } elseif ($avgSentiment < -0.2) {
            $sentimentSignal = 'BEARISH';
            $confidence = min(90, 60 + $sentimentStrength);
        } else {
            $sentimentSignal = 'NEUTRAL';
            $confidence = 50;
        }
        
        return [
            'signal' => $sentimentSignal,
            'confidence' => round($confidence, 1),
            'sentiment_score' => round($avgSentiment, 3),
            'total_articles' => $totalArticles,
            'positive_ratio' => round($positiveCount / $totalArticles * 100, 1),
            'negative_ratio' => round($negativeCount / $totalArticles * 100, 1),
            'neutral_ratio' => round($neutralCount / $totalArticles * 100, 1),
            'last_updated' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Calculate sentiment score for a text
     * @param string $text Text to analyze
     * @return float Sentiment score (-1 to 1)
     */
    private function calculateSentimentScore($text) {
        $positiveScore = 0;
        $negativeScore = 0;
        
        // Count positive keywords
        foreach ($this->positiveKeywords as $keyword) {
            $positiveScore += substr_count($text, $keyword);
        }
        
        // Count negative keywords  
        foreach ($this->negativeKeywords as $keyword) {
            $negativeScore += substr_count($text, $keyword);
        }
        
        $totalWords = str_word_count($text);
        if ($totalWords == 0) return 0;
        
        // Normalize scores
        $positiveRatio = $positiveScore / $totalWords;
        $negativeRatio = $negativeScore / $totalWords;
        
        return ($positiveRatio - $negativeRatio) * 10; // Scale the score
    }
    
    /**
     * Get news from CoinDesk API (free tier)
     * @param string $symbol Cryptocurrency symbol
     * @param int $hours Hours to look back
     * @return array News articles
     */
    private function getCoinDeskNews($symbol, $hours) {
        // Simulate CoinDesk API response (replace with real API call)
        $newsItems = [
            [
                'title' => 'Bitcoin Shows Strong Bullish Momentum as Institutional Adoption Grows',
                'description' => 'Major institutions continue to accumulate Bitcoin, driving positive sentiment.',
                'published_at' => date('Y-m-d H:i:s', time() - 3600),
                'source' => 'CoinDesk'
            ],
            [
                'title' => 'Ethereum Network Upgrade Brings Optimistic Outlook',
                'description' => 'Technical improvements and reduced fees boost Ethereum adoption.',
                'published_at' => date('Y-m-d H:i:s', time() - 7200),
                'source' => 'CoinDesk'
            ]
        ];
        
        return $newsItems;
    }
    
    /**
     * Get cryptocurrency news from various APIs
     * @param string $symbol Cryptocurrency symbol
     * @param int $hours Hours to look back
     * @return array News articles
     */
    private function getCryptoNewsAPI($symbol, $hours) {
        // Simulate crypto news API (replace with real API calls)
        $newsItems = [
            [
                'title' => 'Market Analysis: Strong Technical Indicators Support Rally',
                'description' => 'RSI and MACD indicators show bullish divergence across major cryptocurrencies.',
                'published_at' => date('Y-m-d H:i:s', time() - 1800),
                'source' => 'CryptoNews'
            ]
        ];
        
        return $newsItems;
    }
    
    /**
     * Get Reddit sentiment (simplified simulation)
     * @param string $symbol Cryptocurrency symbol
     * @param int $hours Hours to look back
     * @return array Reddit posts sentiment
     */
    private function getRedditSentiment($symbol, $hours) {
        // Simulate Reddit API response (replace with real Reddit API)
        $redditPosts = [
            [
                'title' => 'Bullish on ' . $symbol . ' - institutional money flowing in',
                'description' => 'Whales are accumulating, this looks very bullish for the long term.',
                'published_at' => date('Y-m-d H:i:s', time() - 900),
                'source' => 'Reddit'
            ]
        ];
        
        return $redditPosts;
    }
    
    /**
     * Get default sentiment when no news is available
     * @return array Default neutral sentiment
     */
    private function getDefaultSentiment() {
        return [
            'signal' => 'NEUTRAL',
            'confidence' => 50.0,
            'sentiment_score' => 0.0,
            'total_articles' => 0,
            'positive_ratio' => 33.3,
            'negative_ratio' => 33.3,
            'neutral_ratio' => 33.3,
            'last_updated' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Get social media trends for cryptocurrency
     * @param string $symbol Cryptocurrency symbol
     * @return array Social media sentiment
     */
    public function getSocialMediaTrends($symbol) {
        // Simulate social media sentiment (replace with real Twitter/Telegram APIs)
        $trendData = [
            'mention_volume' => rand(100, 1000),
            'positive_mentions' => rand(30, 70),
            'negative_mentions' => rand(10, 40),
            'influencer_sentiment' => rand(-100, 100) / 100,
            'trending_hashtags' => ['#' . $symbol, '#crypto', '#bullish'],
            'sentiment_velocity' => rand(-50, 50) / 100 // Change in sentiment over time
        ];
        
        return $trendData;
    }
    
    /**
     * Combine all sentiment sources for final analysis
     * @param string $symbol Cryptocurrency symbol
     * @return array Complete sentiment analysis
     */
    public function getCompleteSentimentAnalysis($symbol) {
        $newsSentiment = $this->getCryptoNewsSentiment($symbol);
        $socialTrends = $this->getSocialMediaTrends($symbol);
        
        // Weight different sources
        $newsWeight = 0.6;
        $socialWeight = 0.4;
        
        $combinedScore = ($newsSentiment['sentiment_score'] * $newsWeight) + 
                        ($socialTrends['influencer_sentiment'] * $socialWeight);
        
        // Determine final sentiment signal
        if ($combinedScore > 0.3) {
            $finalSignal = 'BULLISH';
            $confidence = min(95, 60 + abs($combinedScore) * 100);
        } elseif ($combinedScore < -0.3) {
            $finalSignal = 'BEARISH';
            $confidence = min(95, 60 + abs($combinedScore) * 100);
        } else {
            $finalSignal = 'NEUTRAL';
            $confidence = 50 + abs($combinedScore) * 50;
        }
        
        return [
            'sentiment_signal' => $finalSignal,
            'confidence' => round($confidence, 1),
            'combined_score' => round($combinedScore, 3),
            'news_sentiment' => $newsSentiment,
            'social_trends' => $socialTrends,
            'analysis_timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
?>