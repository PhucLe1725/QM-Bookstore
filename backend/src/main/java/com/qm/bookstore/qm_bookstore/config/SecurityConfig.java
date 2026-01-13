package com.qm.bookstore.qm_bookstore.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfig corsConfig) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                    corsConfiguration.addAllowedOrigin("http://localhost:5173");
                    corsConfiguration.addAllowedOrigin("http://localhost:3000");
                    corsConfiguration.addAllowedOrigin("https://qm-bookstore.vercel.app");
                    corsConfiguration.addAllowedOrigin("https://phucle5066.id.vn");
                    corsConfiguration.addAllowedHeader("*");
                    corsConfiguration.addAllowedMethod("*");
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ========== PUBLIC ENDPOINTS ==========
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        
                        // ========== WEBSOCKET ENDPOINTS ==========
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/app/**").permitAll()
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/queue/**").permitAll()
                        
                        // ========== CHAT ENDPOINTS ==========
                        .requestMatchers("/api/chat/history/**").authenticated()
                        .requestMatchers("/api/chat/admin/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/chat/conversations").hasAnyRole("admin", "manager")

                        // ========== NOTIFICATION ENDPOINTS ==========
                        .requestMatchers("/api/notifications/user/**").permitAll()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/notifications/admin/**").hasAnyRole("admin", "manager")

                        // ========== USER ENDPOINTS ==========
                        .requestMatchers("/api/users/profile/**").authenticated()
                        .requestMatchers("/api/users/change-password").authenticated()
                        .requestMatchers("/api/users/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/roles/**").hasRole("admin")

                        // ========== CART ENDPOINTS ==========
                        .requestMatchers("/api/cart/**").permitAll() // Guests can use cart with session
                        
                        // ========== INVENTORY ENDPOINTS ==========
                        .requestMatchers(HttpMethod.GET, "/api/inventory/transactions/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/inventory/transactions/**").hasAnyRole("admin", "manager")
                        
                        // ========== ORDER ENDPOINTS ==========
                        // Customer order endpoints (requires authentication)
                        .requestMatchers("/api/orders/checkout").authenticated()
                        .requestMatchers("/api/orders/my-orders").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/orders/*").authenticated() // GET /api/orders/{orderId}
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").authenticated() // POST /api/orders/{orderId}/cancel
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/reorder").authenticated() // POST /api/orders/{orderId}/reorder
                        
                        // Admin/Manager order endpoints
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/orders/manage/**").hasAnyRole("admin", "manager")
                        
                        // ========== INVOICE ENDPOINTS ==========
                        // Authenticated users can generate/view their own invoices
                        // Admin/Manager can generate/view any invoice (validated in service layer)
                        .requestMatchers("/api/invoices/**").authenticated()
                        
                        // ========== PRODUCT & CATEGORY ENDPOINTS ==========
                        .requestMatchers("/api/products/manage/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/categories/manage/**").hasAnyRole("admin", "manager")
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-comments/**").permitAll()
                        
                        // ========== ADMIN ENDPOINTS ==========
                        .requestMatchers("/api/admin/**").hasAnyRole("admin", "manager")
                        
                        // ========== DEFAULT ==========
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
