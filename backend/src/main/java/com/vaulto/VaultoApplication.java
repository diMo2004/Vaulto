package com.vaulto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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
							System.setProperty(key, value);
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

}
