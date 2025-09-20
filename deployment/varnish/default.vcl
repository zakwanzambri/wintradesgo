# Varnish CDN Configuration for Multi-Region Deployment
# WinTrades Global Trading Platform

vcl 4.1;

import directors;
import std;

# Backend definitions
backend app_us_east {
    .host = "app_us_east";
    .port = "80";
    .probe = {
        .url = "/health";
        .timeout = 5s;
        .interval = 10s;
        .window = 5;
        .threshold = 3;
    }
}

backend app_eu_west {
    .host = "app_eu_west";
    .port = "80";
    .probe = {
        .url = "/health";
        .timeout = 5s;
        .interval = 10s;
        .window = 5;
        .threshold = 3;
    }
}

backend app_asia_pacific {
    .host = "app_asia_pacific";
    .port = "80";
    .probe = {
        .url = "/health";
        .timeout = 5s;
        .interval = 10s;
        .window = 5;
        .threshold = 3;
    }
}

# ACL for purging
acl purge {
    "localhost";
    "127.0.0.1";
    "::1";
    "10.0.0.0"/8;
    "172.16.0.0"/12;
    "192.168.0.0"/16;
}

sub vcl_init {
    # Round-robin director for load balancing
    new cluster = directors.round_robin();
    cluster.add_backend(app_us_east, 1.0);
    cluster.add_backend(app_eu_west, 1.0);
    cluster.add_backend(app_asia_pacific, 1.0);
}

sub vcl_recv {
    # Set backend
    set req.backend_hint = cluster.backend();
    
    # Handle PURGE requests
    if (req.method == "PURGE") {
        if (!client.ip ~ purge) {
            return (synth(405, "Purging not allowed"));
        }
        return (purge);
    }
    
    # Only handle GET, HEAD, POST, PUT, DELETE methods
    if (req.method != "GET" &&
        req.method != "HEAD" &&
        req.method != "POST" &&
        req.method != "PUT" &&
        req.method != "DELETE") {
        return (pass);
    }
    
    # Don't cache API requests
    if (req.url ~ "^/api/") {
        return (pass);
    }
    
    # Don't cache real-time data
    if (req.url ~ "^/(ws|websocket|real-time)/") {
        return (pass);
    }
    
    # Don't cache authenticated requests
    if (req.http.Authorization || req.http.Cookie ~ "PHPSESSID|auth_token") {
        return (pass);
    }
    
    # Cache static assets
    if (req.url ~ "\.(css|js|png|gif|jpg|jpeg|ico|svg|woff|woff2|ttf|eot)(\?.*)?$") {
        unset req.http.Cookie;
        return (hash);
    }
    
    # Cache HTML pages for short periods
    if (req.url ~ "\.(html|htm)(\?.*)?$") {
        unset req.http.Cookie;
        return (hash);
    }
    
    # Pass everything else
    return (pass);
}

sub vcl_backend_response {
    # Set cache TTL based on content type
    if (bereq.url ~ "\.(css|js|png|gif|jpg|jpeg|ico|svg|woff|woff2|ttf|eot)(\?.*)?$") {
        # Cache static assets for 1 week
        set beresp.ttl = 7d;
        set beresp.http.Cache-Control = "public, max-age=604800";
        unset beresp.http.Set-Cookie;
    } elsif (bereq.url ~ "\.(html|htm)(\?.*)?$") {
        # Cache HTML for 5 minutes
        set beresp.ttl = 5m;
        set beresp.http.Cache-Control = "public, max-age=300";
        unset beresp.http.Set-Cookie;
    } elsif (beresp.http.Content-Type ~ "application/json") {
        # Don't cache JSON responses
        set beresp.ttl = 0s;
        set beresp.http.Cache-Control = "no-cache, no-store, must-revalidate";
    }
    
    # Enable ESI for dynamic content
    if (beresp.http.Content-Type ~ "text/html") {
        set beresp.do_esi = true;
    }
    
    # Compress responses
    if (beresp.http.Content-Type ~ "text|application/javascript|application/json|application/xml") {
        set beresp.do_gzip = true;
    }
    
    # Health check responses
    if (bereq.url == "/health") {
        set beresp.ttl = 10s;
        set beresp.http.Cache-Control = "public, max-age=10";
    }
    
    return (deliver);
}

sub vcl_deliver {
    # Add cache status header
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
        set resp.http.X-Cache-Hits = obj.hits;
    } else {
        set resp.http.X-Cache = "MISS";
    }
    
    # Add backend server information
    set resp.http.X-Served-By = server.hostname;
    
    # Security headers
    set resp.http.X-Frame-Options = "DENY";
    set resp.http.X-Content-Type-Options = "nosniff";
    set resp.http.X-XSS-Protection = "1; mode=block";
    
    # Remove internal headers
    unset resp.http.Via;
    unset resp.http.X-Varnish;
    unset resp.http.Age;
    
    return (deliver);
}

sub vcl_hit {
    # Handle stale content
    if (obj.ttl >= 0s) {
        return (deliver);
    }
    
    # Serve stale content for up to 1 hour if backend is down
    if (obj.ttl + obj.grace > 0s) {
        return (deliver);
    }
    
    return (miss);
}

sub vcl_miss {
    return (fetch);
}

sub vcl_pass {
    return (fetch);
}

sub vcl_pipe {
    return (pipe);
}

sub vcl_purge {
    return (synth(200, "Purged"));
}

sub vcl_synth {
    if (resp.status == 720) {
        # Redirect to HTTPS
        set resp.status = 301;
        set resp.http.Location = "https://" + req.http.Host + req.url;
        return (deliver);
    }
    
    # Custom error pages
    if (resp.status == 503) {
        set resp.http.Content-Type = "text/html; charset=utf-8";
        synthetic({"
            <!DOCTYPE html>
            <html>
            <head>
                <title>WinTrades - Service Temporarily Unavailable</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #333; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <h1>Service Temporarily Unavailable</h1>
                <p>We're performing maintenance. Please try again in a few minutes.</p>
                <p>For urgent trading needs, please contact support.</p>
            </body>
            </html>
        "});
        return (deliver);
    }
    
    return (deliver);
}