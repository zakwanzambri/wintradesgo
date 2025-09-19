import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Shield, 
  Zap, 
  Target,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analytics',
      description: 'Advanced machine learning algorithms analyze market trends and predict price movements with high accuracy.',
      color: 'text-primary-600'
    },
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Get instant updates on market movements, price alerts, and portfolio changes as they happen.',
      color: 'text-secondary-600'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Sophisticated risk assessment tools help you make informed decisions and protect your investments.',
      color: 'text-accent-600'
    },
    {
      icon: Target,
      title: 'Signal Alerts',
      description: 'Receive precise buy/sell signals based on technical analysis and sentiment indicators.',
      color: 'text-primary-600'
    },
    {
      icon: BarChart3,
      title: 'Portfolio Tracking',
      description: 'Monitor your entire crypto portfolio with detailed analytics and performance metrics.',
      color: 'text-secondary-600'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Ultra-low latency data processing ensures you never miss a trading opportunity.',
      color: 'text-accent-600'
    }
  ]

  const stats = [
    { label: 'Active Traders', value: '50K+', icon: Users },
    { label: 'Profit Generated', value: '$2.5M+', icon: DollarSign },
    { label: 'Accuracy Rate', value: '94%', icon: Target },
    { label: 'Cryptocurrencies', value: '500+', icon: TrendingUp }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Professional Trader',
      content: 'WinTrades has completely transformed my trading strategy. The AI insights are incredibly accurate.',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Crypto Investor',
      content: 'The portfolio tracking and risk management features have helped me optimize my investments.',
      rating: 5,
      avatar: '👨‍💻'
    },
    {
      name: 'David Kim',
      role: 'DeFi Enthusiast',
      content: 'Real-time alerts and sentiment analysis give me the edge I need in this volatile market.',
      rating: 5,
      avatar: '👨‍🎓'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-dark-100 dark:via-dark-200 dark:to-dark-100">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                AI-Powered
                <span className="text-gradient block">
                  Crypto Trading
                </span>
                Intelligence
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Harness the power of artificial intelligence to make smarter crypto trading decisions. 
                Get real-time market insights, sentiment analysis, and portfolio optimization tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard" className="btn-primary text-center">
                  Start Trading Now
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </Link>
                <Link to="/pricing" className="btn-outline text-center">
                  View Pricing
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-accent-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free 14-day trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-accent-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">No credit card required</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white dark:bg-dark-100 rounded-2xl shadow-2xl p-8 animate-float">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Overview</h3>
                    <span className="text-sm text-accent-600 font-medium">+24.5%</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">$127,543.21</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Portfolio Value</div>
                </div>
                <div className="space-y-3">
                  {['Bitcoin', 'Ethereum', 'Cardano'].map((crypto, index) => (
                    <div key={crypto} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${
                          index === 0 ? 'from-yellow-400 to-orange-500' :
                          index === 1 ? 'from-blue-400 to-purple-500' :
                          'from-green-400 to-blue-500'
                        }`}></div>
                        <span className="font-medium text-gray-900 dark:text-white">{crypto}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          +{(Math.random() * 10 + 5).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">24h</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-accent-400 to-primary-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to
              <span className="text-gradient"> Dominate the Market</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered tools gives you the competitive edge 
              you need in the fast-paced world of cryptocurrency trading.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card hover:scale-105 group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.color} bg-current bg-opacity-10`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by <span className="text-gradient">Thousands of Traders</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users have to say about their trading success
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic">
                  "{testimonial.content}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Revolutionize Your Trading?
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join thousands of successful traders who are already using AI to maximize their profits. 
              Start your free trial today and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/pricing" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200">
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage