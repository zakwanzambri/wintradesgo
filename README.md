# WinTrades - AI-Powered Crypto Market Analytics Website

🚀 **Modern AI-Powered Crypto Market Analytics Platform**

This project is a modern, responsive web platform for real-time cryptocurrency market insights, built with React + Tailwind CSS. It's designed as a comprehensive SaaS-style analytics dashboard for traders, investors, and crypto enthusiasts.

![WinTrades Landing Page](https://github.com/user-attachments/assets/f3885ed7-1010-4e15-bf69-6eb4ede6480b)

## ✨ Features

### 🏠 **Landing Page**
- **Hero Section** with compelling value proposition
- **Portfolio Overview** with animated mock data
- **Statistics** showcasing platform metrics
- **Feature Highlights** with clean icons and descriptions
- **Customer Testimonials** with ratings and feedback
- **Call-to-Action** sections throughout

### 📊 **Dashboard**
- **Real-time Market Data** with interactive charts
- **AI Trading Signals** with confidence levels
- **Portfolio Statistics** with performance metrics
- **Market Sentiment Analysis** with pie charts
- **Crypto Asset Tracking** with live price updates
- **Quick Actions** for trading operations

### 💼 **Portfolio Tracker**
- **Portfolio Allocation** visualization
- **Performance Charts** with historical data
- **Holdings Management** with detailed tables
- **Transaction History** with filtering options
- **Performance Metrics** and analytics
- **Export Functionality** for data analysis

### 💰 **Pricing Plans**
- **Tiered Pricing** (Starter, Professional, Enterprise)
- **Feature Comparison** table
- **Customer Testimonials** by plan type
- **FAQ Section** addressing common concerns
- **Monthly/Annual Billing** toggle with savings

### 🎨 **Design System**
- **Clean, Minimal Design** with modern aesthetics
- **Mobile-Responsive** layout for all devices
- **Dark/Light Theme** ready (dark theme colors defined)
- **Smooth Animations** using Framer Motion
- **Professional Color Palette** with consistent branding
- **Custom Tailwind Components** for reusability

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS 3.x with custom design system
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth UI transitions
- **Routing**: React Router DOM for navigation
- **Icons**: Lucide React for consistent iconography
- **Typography**: Inter & JetBrains Mono fonts

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zakwanzambri/wintradesgo.git
   cd wintradesgo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx          # Navigation header
│   │   └── Footer.jsx          # Site footer
│   ├── dashboard/              # Dashboard components
│   ├── pricing/                # Pricing components
│   └── portfolio/              # Portfolio components
├── pages/
│   ├── LandingPage.jsx         # Home page
│   ├── Dashboard.jsx           # Trading dashboard
│   ├── Portfolio.jsx           # Portfolio tracker
│   └── Pricing.jsx             # Pricing plans
├── utils/                      # Utility functions
├── data/                       # Mock data
├── App.jsx                     # Main app component
├── main.jsx                    # App entry point
└── index.css                   # Global styles
```

## 🎯 Key Features Implemented

### Landing Page
- [x] Hero section with AI-powered messaging
- [x] Animated portfolio overview card
- [x] Statistics section with key metrics
- [x] Feature showcase with icons
- [x] Customer testimonials
- [x] Multiple CTA sections

### Dashboard
- [x] Real-time market charts (using mock data)
- [x] AI signal alerts with confidence scores
- [x] Portfolio performance metrics
- [x] Market sentiment visualization
- [x] Cryptocurrency price tracking
- [x] Interactive time frame selection

### Portfolio
- [x] Portfolio allocation pie chart
- [x] Performance line charts
- [x] Holdings table with sorting
- [x] Transaction history
- [x] Tabbed interface (Overview, Holdings, Transactions, Performance)
- [x] Export and filter functionality

### Pricing
- [x] Three-tier pricing structure
- [x] Monthly/Annual billing toggle
- [x] Feature comparison table
- [x] Customer testimonials by plan
- [x] FAQ section
- [x] Clear CTAs for each plan

### Design & UX
- [x] Consistent color scheme and branding
- [x] Smooth page transitions
- [x] Responsive navigation with mobile menu
- [x] Loading states and hover effects
- [x] Professional typography hierarchy
- [x] Accessible design patterns

## 🔧 Customization

### Colors
The project uses a custom color palette defined in `tailwind.config.js`:
- **Primary**: Blue tones for main actions
- **Secondary**: Cyan tones for secondary elements  
- **Accent**: Green tones for success states
- **Dark**: Gray scale for dark theme support

### Components
Reusable components are built with Tailwind's `@apply` directive:
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.btn-outline` - Outline style buttons
- `.card` - Consistent card styling
- `.text-gradient` - Gradient text effects

## 🚀 Deployment

The project is built with Vite and can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions for automatic deployment
- **AWS S3**: Upload the `dist` folder to an S3 bucket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Recharts** for excellent charting components
- **Framer Motion** for smooth animations
- **Tailwind CSS** for rapid UI development
- **Lucide** for beautiful icons
- **React** ecosystem for powerful development tools

---

**Built with ❤️ for crypto traders and fintech enthusiasts**
