package com.smartrasoi.controller;

import com.smartrasoi.dto.AuthResponse;
import com.smartrasoi.dto.LoginRequest;
import com.smartrasoi.dto.RegisterRequest;
import com.smartrasoi.entity.Role;
import com.smartrasoi.entity.User;
import com.smartrasoi.repository.UserRepository;
import com.smartrasoi.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getId(), user.getName(), user.getEmail());

        return ResponseEntity.ok(new AuthResponse(token, "Bearer", userDto));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build(); // Return appropriate error later
        }

        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(Role.USER);

        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerRequest.getEmail(), registerRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getId(), user.getName(), user.getEmail());

        return new ResponseEntity<>(new AuthResponse(token, "Bearer", userDto), HttpStatus.CREATED);
    }
    
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Optional<User> userOptional = userRepository.findByEmail(authentication.getName());
        if(userOptional.isPresent()){
             User user = userOptional.get();
             return ResponseEntity.ok(new AuthResponse.UserDto(user.getId(), user.getName(), user.getEmail()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
