package com.example.auth;

import com.example.auth.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class AuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthApplication.class, args);
	}

	@Bean
	CommandLineRunner init(AuthService authService) {
		return args -> {
			try {
				authService.register("toto@example.com", "Pwd1234@test");
			} catch (Exception e) {
				// Compte déjà existant
			}
		};
	}
}