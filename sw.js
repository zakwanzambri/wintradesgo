// WinTrades Mobile App Service Worker for Push Notifications
// Version: 1.0.0

const CACHE_NAME = 'wintrades-mobile-v1';
const urlsToCache = [
    '/wintradesgo/mobile-settings.html',
    '/wintradesgo/api/trading/production.php',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Cache install failed:', error);
            })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control immediately
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(error => {
                console.error('Fetch failed:', error);
                // Return offline page if available
                return caches.match('/wintradesgo/offline.html');
            })
    );
});

// Push event for ML signal notifications
self.addEventListener('push', event => {
    console.log('Push notification received:', event);
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        console.error('Error parsing push data:', e);
    }
    
    const options = {
        body: data.body || 'New ML trading signal available',
        icon: data.icon || '/wintradesgo/favicon.ico',
        badge: '/wintradesgo/favicon.ico',
        tag: data.tag || 'ml-signal',
        data: data,
        requireInteraction: data.requireInteraction || true,
        actions: [
            {
                action: 'view',
                title: 'View Signal',
                icon: '/wintradesgo/icons/view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/wintradesgo/icons/close.png'
            }
        ],
        vibrate: [200, 100, 200], // Vibration pattern
        silent: false
    };
    
    // Customize notification based on signal type
    if (data.signal_type) {
        switch (data.signal_type) {
            case 'buy':
                options.icon = '/wintradesgo/icons/buy-signal.png';
                options.badge = '/wintradesgo/icons/buy-badge.png';
                options.body = `🚀 BUY Signal: ${data.symbol}\nConfidence: ${data.confidence}%\nPrice: $${data.price}`;
                break;
            case 'sell':
                options.icon = '/wintradesgo/icons/sell-signal.png';
                options.badge = '/wintradesgo/icons/sell-badge.png';
                options.body = `📉 SELL Signal: ${data.symbol}\nConfidence: ${data.confidence}%\nPrice: $${data.price}`;
                break;
            case 'risk':
                options.icon = '/wintradesgo/icons/risk-alert.png';
                options.badge = '/wintradesgo/icons/risk-badge.png';
                options.body = `⚠️ Risk Alert: ${data.symbol}\nRisk Level: ${data.risk_level}\nAction Required`;
                break;
            default:
                options.body = `📊 ${data.symbol} Signal\nConfidence: ${data.confidence}%`;
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'WinTrades AI Alert',
            options
        )
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    if (action === 'view') {
        // Open the mobile app/dashboard
        event.waitUntil(
            clients.openWindow(`/wintradesgo/mobile-dashboard.html?signal=${data.id}`)
        );
    } else if (action === 'dismiss') {
        // Just close the notification
        console.log('Notification dismissed');
    } else {
        // Default click action - open app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Check if app is already open
                for (let client of clientList) {
                    if (client.url.includes('/wintradesgo/') && 'focus' in client) {
                        client.focus();
                        // Send message to app about the notification
                        client.postMessage({
                            type: 'notification-click',
                            data: data
                        });
                        return;
                    }
                }
                // Open new window if app not open
                return clients.openWindow('/wintradesgo/mobile-settings.html');
            })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Background sync:', event.tag);
    
    if (event.tag === 'ml-signals-sync') {
        event.waitUntil(syncMLSignals());
    } else if (event.tag === 'settings-sync') {
        event.waitUntil(syncSettings());
    }
});

// Background fetch for ML signal updates
self.addEventListener('backgroundfetch', event => {
    console.log('Background fetch:', event.tag);
    
    if (event.tag === 'ml-signals-update') {
        event.waitUntil(
            fetch('/wintradesgo/api/trading/production.php?action=get_latest_signals')
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.signals) {
                        // Process new signals
                        data.signals.forEach(signal => {
                            if (signal.confidence >= 90) {
                                // Show high-confidence signal notification
                                self.registration.showNotification(
                                    `High Confidence ${signal.signal_type.toUpperCase()} Signal`,
                                    {
                                        body: `${signal.symbol}: ${signal.confidence}% confidence`,
                                        tag: `signal-${signal.id}`,
                                        data: signal
                                    }
                                );
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Background fetch failed:', error);
                })
        );
    }
});

// Periodic background sync for ML signals
self.addEventListener('periodicsync', event => {
    if (event.tag === 'ml-signals-periodic') {
        event.waitUntil(periodicMLSignalCheck());
    }
});

// Helper functions
async function syncMLSignals() {
    try {
        const response = await fetch('/wintradesgo/api/trading/production.php?action=sync_ml_signals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('ML signals synced:', data);
        
        // Store in IndexedDB for offline access
        const db = await openDB();
        const tx = db.transaction(['signals'], 'readwrite');
        const store = tx.objectStore('signals');
        
        if (data.signals) {
            data.signals.forEach(signal => {
                store.put(signal);
            });
        }
        
        await tx.complete;
        
    } catch (error) {
        console.error('ML signals sync failed:', error);
    }
}

async function syncSettings() {
    try {
        // Get settings from IndexedDB
        const db = await openDB();
        const tx = db.transaction(['settings'], 'readonly');
        const store = tx.objectStore('settings');
        const settings = await store.get('user-settings');
        
        if (settings) {
            const response = await fetch('/wintradesgo/api/trading/production.php?action=save_mobile_settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings.data)
            });
            
            const result = await response.json();
            console.log('Settings synced:', result);
        }
        
    } catch (error) {
        console.error('Settings sync failed:', error);
    }
}

async function periodicMLSignalCheck() {
    try {
        const response = await fetch('/wintradesgo/api/trading/production.php?action=check_high_confidence_signals');
        const data = await response.json();
        
        if (data.success && data.signals && data.signals.length > 0) {
            // Show notifications for new high-confidence signals
            data.signals.forEach(signal => {
                if (signal.confidence >= 90) {
                    self.registration.showNotification(
                        `🤖 AI Signal Alert: ${signal.symbol}`,
                        {
                            body: `${signal.signal_type.toUpperCase()} - ${signal.confidence}% confidence\nPrice: $${signal.current_price}`,
                            icon: '/wintradesgo/icons/ai-signal.png',
                            tag: `periodic-${signal.id}`,
                            data: signal,
                            requireInteraction: true
                        }
                    );
                }
            });
        }
        
    } catch (error) {
        console.error('Periodic ML signal check failed:', error);
    }
}

// IndexedDB helper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('WinTradesDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('signals')) {
                const signalsStore = db.createObjectStore('signals', { keyPath: 'id' });
                signalsStore.createIndex('timestamp', 'timestamp');
                signalsStore.createIndex('confidence', 'confidence');
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
            
            if (!db.objectStoreNames.contains('portfolio')) {
                const portfolioStore = db.createObjectStore('portfolio', { keyPath: 'symbol' });
                portfolioStore.createIndex('last_updated', 'last_updated');
            }
        };
    });
}

// Message handling from main app
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'skip-waiting':
            self.skipWaiting();
            break;
        case 'cache-update':
            updateCache(data);
            break;
        case 'test-notification':
            self.registration.showNotification('Test Notification', {
                body: 'Service Worker is working correctly!',
                icon: '/wintradesgo/favicon.ico'
            });
            break;
        default:
            console.log('Unknown message type:', type);
    }
});

async function updateCache(urls) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);
        console.log('Cache updated with new URLs');
    } catch (error) {
        console.error('Cache update failed:', error);
    }
}

// Error handling
self.addEventListener('error', event => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('WinTrades Service Worker loaded successfully');