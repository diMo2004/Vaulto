package com.vaulto;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

import java.net.URI;

@SpringBootApplication
public class VaultoApplication {

	static {
		try {
			java.io.File envFile = new java.io.File(".env");
			if (envFile.exists()) {
				java.nio.file.Files.lines(envFile.toPath())
					.map(String::trim)
					.filter(line -> !line.isEmpty() && !line.startsWith("#"))
					.forEach(line -> {
						int delim = line.indexOf("=");
						if (delim != -1) {
							String key = line.substring(0, delim).trim();
							String value = line.substring(delim + 1).trim();
							// Strip inline comments if any
							int hashIdx = value.indexOf("#");
							if (hashIdx != -1) {
								value = value.substring(0, hashIdx).trim();
							}
							if (value.startsWith("\"") && value.endsWith("\"")) {
								value = value.substring(1, value.length() - 1);
							} else if (value.startsWith("'") && value.endsWith("'")) {
								value = value.substring(1, value.length() - 1);
							}
							if (System.getenv(key) == null && System.getProperty(key) == null) {
								System.setProperty(key, value);
							}
						}
					});
			}
		} catch (Exception e) {
			System.err.println("Warning: Failed to load .env file: " + e.getMessage());
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(VaultoApplication.class, args);
	}

	@Bean
	ApplicationRunner logMongoConfiguration(Environment environment) {
		return args -> {
			String mongoUri = environment.getProperty("spring.data.mongodb.uri", "");
			String source = "fallback";
			if (System.getenv("SPRING_DATA_MONGODB_URI") != null) {
				source = "SPRING_DATA_MONGODB_URI";
			} else if (System.getenv("MONGO_URI") != null) {
				source = "MONGO_URI";
			} else if (System.getenv("MONGODB_URI") != null) {
				source = "MONGODB_URI";
			}
			System.out.println("MongoDB configuration source: " + source + ", target: " + sanitizeMongoTarget(mongoUri));
		};
	}

	private static String sanitizeMongoTarget(String mongoUri) {
		try {
			URI uri = URI.create(mongoUri.replace("mongodb+srv://", "mongodb://"));
			return uri.getHost() != null ? uri.getHost() : "unknown";
		} catch (Exception e) {
			return mongoUri.startsWith("mongodb://localhost") ? "localhost" : "configured";
		}
	}

}
