import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Check, 
  X, 
  Star, 
  Users, 
  Zap, 
  Shield, 
  Brain,
  BarChart3,
  AlertTriangle,
  Smartphone,
  HeadphonesIcon,
  ArrowRight
} from 'lucide-react'

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for beginners getting started with crypto trading',
      icon: Users,
      price: {
        monthly: 29,
        annual: 290
      },
      features: [
        'Real-time market data',
        'Basic portfolio tracking',
        '5 price alerts',
        'Mobile app access',
        'Email support',
        'Basic analytics'
      ],
      limitations: [
        'Limited to 3 portfolios',
        'No AI signals',
        'No sentiment analysis'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Advanced features for serious traders and investors',
      icon: Zap,
      price: {
        monthly: 79,
        annual: 790
      },
      features: [
        'Everything in Starter',
        'AI-powered trading signals',
        'Advanced sentiment analysis',
        'Unlimited portfolios',
        'Unlimited price alerts',
        'Technical indicators',
        'Risk management tools',
        'Priority support',
        'Advanced analytics',
        'Custom dashboards'
      ],
      limitations: [
        'API rate limits apply'
      ],
      popular: true,
      cta: 'Get Started'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Comprehensive solution for trading firms and institutions',
      icon: Shield,
      price: {
        monthly: 299,
        annual: 2990
      },
      features: [
        'Everything in Professional',
        'Unlimited API access',
        'White-label solutions',
        'Custom integrations',
        'Dedicated account manager',
        'Advanced security features',
        'Custom reporting',
        'Multi-user management',
        '24/7 phone support',
        'SLA guarantees'
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales'
    }
  ]

  const features = [
    {
      category: 'Core Features',
      items: [
        { name: 'Real-time Market Data', starter: true, pro: true, enterprise: true },
        { name: 'Portfolio Tracking', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
        { name: 'Price Alerts', starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Mobile App', starter: true, pro: true, enterprise: true },
        { name: 'Web Dashboard', starter: true, pro: true, enterprise: true },
      ]
    },
    {
      category: 'AI & Analytics',
      items: [
        { name: 'AI Trading Signals', starter: false, pro: true, enterprise: true },
        { name: 'Sentiment Analysis', starter: false, pro: true, enterprise: true },
        { name: 'Predictive Analytics', starter: false, pro: true, enterprise: true },
        { name: 'Risk Assessment', starter: false, pro: true, enterprise: true },
        { name: 'Custom Models', starter: false, pro: false, enterprise: true },
      ]
    },
    {
      category: 'Support & Integration',
      items: [
        { name: 'Email Support', starter: true, pro: true, enterprise: true },
        { name: 'Priority Support', starter: false, pro: true, enterprise: true },
        { name: 'Phone Support', starter: false, pro: false, enterprise: true },
        { name: 'API Access', starter: 'Limited', pro: 'Standard', enterprise: 'Unlimited' },
        { name: 'Custom Integrations', starter: false, pro: false, enterprise: true },
      ]
    }
  ]

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'Professional Trader',
      company: 'TradeFirm Capital',
      content: 'The AI signals have significantly improved my trading performance. The accuracy is impressive.',
      plan: 'Professional',
      avatar: '👨‍💼'
    },
    {
      name: 'Sarah Johnson',
      role: 'Investment Manager',
      company: 'Crypto Ventures LLC',
      content: 'Enterprise features help us manage multiple client portfolios efficiently. Great ROI.',
      plan: 'Enterprise',
      avatar: '👩‍💼'
    },
    {
      name: 'David Rodriguez',
      role: 'Retail Investor',
      company: 'Individual',
      content: 'Started with the Starter plan and upgraded quickly. The value is incredible.',
      plan: 'Professional',
      avatar: '👨‍💻'
    }
  ]

  const faqs = [
    {
      question: 'Can I change my plan at any time?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'We offer a 14-day free trial for all plans. No credit card required to start your trial.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.'
    },
    {
      question: 'How accurate are the AI trading signals?',
      answer: 'Our AI models achieve an average accuracy rate of 87% based on historical backtesting and real-world performance.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans if you\'re not satisfied with our service.'
    }
  ]

  const renderFeatureValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <X className="h-5 w-5 text-gray-400" />
      )
    }
    return <span className="text-sm text-gray-900 dark:text-white">{value}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your <span className="text-gradient">Trading Edge</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Unlock the power of AI-driven crypto trading with our flexible pricing plans. 
            Start with a free trial and scale as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white dark:bg-dark-100 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`relative ${
                plan.popular
                  ? 'card border-2 border-primary-500 shadow-xl scale-105'
                  : 'card hover:scale-105'
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-6 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4">
                  <plan.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="text-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ${plan.price[billingCycle]}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                  {billingCycle === 'annual' && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save ${(plan.price.monthly * 12) - plan.price.annual}
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-center">
                    <X className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-500 dark:text-gray-500">{limitation}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                  plan.popular
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.cta}
                {plan.cta !== 'Contact Sales' && <ArrowRight className="ml-2 h-4 w-4 inline" />}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Feature Comparison
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Compare all features across our pricing plans
            </p>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-white">Features</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 dark:text-white">Starter</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 dark:text-white">Professional</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 dark:text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((category) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-gray-50 dark:bg-dark-200">
                      <td colSpan={4} className="py-3 px-6 font-semibold text-gray-900 dark:text-white">
                        {category.category}
                      </td>
                    </tr>
                    {category.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{item.name}</td>
                        <td className="py-4 px-6 text-center">{renderFeatureValue(item.starter)}</td>
                        <td className="py-4 px-6 text-center">{renderFeatureValue(item.pro)}</td>
                        <td className="py-4 px-6 text-center">{renderFeatureValue(item.enterprise)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of successful traders using WinTrades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card"
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} • {testimonial.company}
                    </div>
                    <div className="text-xs text-primary-600 font-medium">
                      {testimonial.plan} Plan
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{testimonial.content}"
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-center bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Trading Smarter?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of traders who are already using AI to maximize their profits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Link>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200">
              Contact Sales
            </button>
          </div>
          <p className="text-white/80 text-sm mt-4">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Pricing