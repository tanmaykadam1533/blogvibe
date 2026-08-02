package com.blogvibe.config;

import com.blogvibe.model.Role;
import com.blogvibe.model.User;
import com.blogvibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@blogvibe.com";
        Optional<User> adminOpt = userRepository.findByEmail(adminEmail);

        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                    .name("System Administrator")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .provider(User.AuthProvider.LOCAL)
                    .bio("BlogVibe Administrator")
                    .banned(false)
                    .build();
            userRepository.save(admin);
            log.info("Initialized default local Administrator account: admin@blogvibe.com / Admin@123");
        } else {
            User admin = adminOpt.get();
            if (admin.getRole() != Role.ROLE_ADMIN) {
                admin.setRole(Role.ROLE_ADMIN);
                userRepository.save(admin);
                log.info("Ensured account '{}' has ROLE_ADMIN status.", adminEmail);
            }
        }

        // Reset any non-admin accounts that were accidentally assigned ROLE_ADMIN during initial setup
        userRepository.findAll().forEach(u -> {
            if (!adminEmail.equalsIgnoreCase(u.getEmail()) && u.getRole() == Role.ROLE_ADMIN) {
                u.setRole(Role.ROLE_USER);
                userRepository.save(u);
                log.info("Reset regular user '{}' ({}) back to ROLE_USER.", u.getName(), u.getEmail());
            }
        });
    }
}
