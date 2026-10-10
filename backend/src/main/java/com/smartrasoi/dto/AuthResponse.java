package com.smartrasoi.dto;





public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private UserDto user;

    public AuthResponse(String accessToken, String tokenType, UserDto user) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public String getTokenType() { return tokenType; }
    public UserDto getUser() { return user; }

    public static class UserDto {
        private Long id;
        private String name;
        private String email;

        public UserDto(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }
}
