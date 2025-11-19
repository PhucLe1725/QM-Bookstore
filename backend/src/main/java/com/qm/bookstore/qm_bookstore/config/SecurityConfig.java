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
                    corsConfiguration.addAllowedHeader("*");
                    corsConfiguration.addAllowedMethod("*");
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        
                        // WebSocket endpoints
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/app/**").permitAll()
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/queue/**").permitAll()
                        
                        // Chat endpoints
                        .requestMatchers("/api/chat/history/**").authenticated()
                        .requestMatchers("/api/chat/admin/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/chat/conversations").hasAnyRole("admin", "manager")

                        // Notification endpoints
                        .requestMatchers("/api/notifications/user/**").permitAll()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/notifications/admin/**").hasAnyRole("admin", "manager")

                        // User profile endpoints (authenticated users can access their own profile)
                        .requestMatchers("/api/users/profile/**").authenticated()

                        // Admin only endpoints
                        .requestMatchers("/api/admin/**").hasRole("admin")
                        .requestMatchers("/api/users/**").hasRole("admin")
                        
                        // Manager and Admin endpoints
                        .requestMatchers("/api/products/manage/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/categories/manage/**").hasAnyRole("admin", "manager")
                        .requestMatchers("/api/orders/manage/**").hasAnyRole("admin", "manager")
                        
                        // Customer endpoints (authenticated users)
                        .requestMatchers("/api/cart/checkout").authenticated() // Checkout requires auth
                        .requestMatchers("/api/cart/**").permitAll() // Other cart operations allow guests
                        .requestMatchers("/api/orders/my/**").hasAnyRole("customer", "admin", "manager")

                        // Public read endpoints for products, categories, reviews and comments
                        .requestMatchers("/api/products/**").permitAll()
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-comments/**").permitAll()
                        
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
