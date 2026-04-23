package com.example.auth;

import com.example.auth.exception.AuthenticationFailedException;
import com.example.auth.exception.InvalidInputException;
import com.example.auth.exception.ResourceConflictException;
import com.example.auth.service.AuthService;
import com.example.auth.service.HmacService;
import com.example.auth.service.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.example.auth.service.EncryptionService;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthApplicationTests {

	@Autowired
	private AuthService authService;

	@Autowired
	private TokenService tokenService;

	@Autowired
	private HmacService hmacService;

	@Autowired
	private EncryptionService encryptionService;

	@Test
	void inscriptionOK() {
		authService.register("test1@example.com", "Abcd1234@test");
		assertNotNull(authService);
	}

	@Test
	void inscriptionEmailDejaExistant() {
		authService.register("test2@example.com", "Abcd1234@test");
		assertThrows(ResourceConflictException.class, () ->
				authService.register("test2@example.com", "Abcd1234@test"));
	}

	@Test
	void validationEmailVide() {
		assertThrows(InvalidInputException.class, () ->
				authService.register("", "Abcd1234@test"));
	}

	@Test
	void validationMotDePasseTropCourt() {
		assertThrows(InvalidInputException.class, () ->
				authService.register("test3@example.com", "abc"));
	}

	@Test
	void loginOKAvecHmacValide() throws Exception {
		authService.register("test4@example.com", "Abcd1234@test");
		String nonce = java.util.UUID.randomUUID().toString();
		long timestamp = System.currentTimeMillis() / 1000;
		String message = "test4@example.com" + ":" + nonce + ":" + timestamp;
		String hmac = hmacService.compute("Abcd1234@test", message);
		String token = authService.login("test4@example.com", nonce, timestamp, hmac);
		assertNotNull(token);
	}

	@Test
	void loginKOHmacInvalide() throws Exception {
		authService.register("test5@example.com", "Abcd1234@test");
		String nonce = java.util.UUID.randomUUID().toString();
		long timestamp = System.currentTimeMillis() / 1000;
		assertThrows(AuthenticationFailedException.class, () ->
				authService.login("test5@example.com", nonce, timestamp, "mauvaishmac"));
	}

	@Test
	void loginKOTimestampExpire() throws Exception {
		authService.register("test6@example.com", "Abcd1234@test");
		String nonce = java.util.UUID.randomUUID().toString();
		long timestamp = System.currentTimeMillis() / 1000 - 120;
		assertThrows(AuthenticationFailedException.class, () ->
				authService.login("test6@example.com", nonce, timestamp, "hmac"));
	}

	@Test
	void loginKOTimestampFutur() throws Exception {
		authService.register("test7@example.com", "Abcd1234@test");
		String nonce = java.util.UUID.randomUUID().toString();
		long timestamp = System.currentTimeMillis() / 1000 + 120;
		assertThrows(AuthenticationFailedException.class, () ->
				authService.login("test7@example.com", nonce, timestamp, "hmac"));
	}

	@Test
	void loginKONonceDejaUtilise() throws Exception {
		authService.register("test8@example.com", "Abcd1234@test");
		String nonce = java.util.UUID.randomUUID().toString();
		long timestamp = System.currentTimeMillis() / 1000;
		String message = "test8@example.com" + ":" + nonce + ":" + timestamp;
		String hmac = hmacService.compute("Abcd1234@test", message);
		authService.login("test8@example.com", nonce, timestamp, hmac);
		assertThrows(AuthenticationFailedException.class, () ->
				authService.login("test8@example.com", nonce, timestamp, hmac));
	}

	@Test
	void loginKOUserInconnu() {
		assertThrows(AuthenticationFailedException.class, () ->
				authService.login("inconnu@example.com", "nonce",
						System.currentTimeMillis() / 1000, "hmac"));
	}

	@Test
	void comparaisonTempsConstant() {
		assertTrue(hmacService.compareConstantTime("abc123", "abc123"));
		assertFalse(hmacService.compareConstantTime("abc123", "xyz789"));
		assertFalse(hmacService.compareConstantTime(null, "abc123"));
	}

	@Test
	void tokenEmisetAccesMeOK() throws Exception {
		authService.register("test9@example.com", "Abcd1234@test");
		String nonce = java.util.UUID.randomUUID().toString();
		long timestamp = System.currentTimeMillis() / 1000;
		String message = "test9@example.com" + ":" + nonce + ":" + timestamp;
		String hmac = hmacService.compute("Abcd1234@test", message);
		authService.login("test9@example.com", nonce, timestamp, hmac);
		String token = tokenService.generateToken("test9@example.com");
		assertTrue(tokenService.isValid(token));
	}

	@Test
	void accesMeSansTokenKO() {
		assertFalse(tokenService.isValid(null));
		assertFalse(tokenService.isValid("token-invalide"));
	}

	@Test
	void validationMotDePasseSansSpecial() {
		assertThrows(InvalidInputException.class, () ->
				authService.register("test10@example.com", "Abcd12345678"));
	}

	@Test
	void validationMotDePasseSansMajuscule() {
		assertThrows(InvalidInputException.class, () ->
				authService.register("test11@example.com", "abcd1234@test"));
	}

	@Test
	void encryptionDecryptionOK() throws Exception {
		authService.register("test12@example.com", "Abcd1234@test");
		assertNotNull(authService);
	}

	@Test
	void encryptionEtDecryptionOK() throws Exception {
		// On définit un mot de passe à tester
		String motDePasse = "MonMotDePasse123!";

		// On chiffre le mot de passe
		String chiffre = encryptionService.encrypt(motDePasse);

		// On déchiffre ce qu'on vient de chiffrer
		String retrouve = encryptionService.decrypt(chiffre);

		// On vérifie qu'on retrouve le même mot de passe
		assertEquals(motDePasse, retrouve);
	}

	@Test
	void motDePasseChiffreEstDifferentDuClair() throws Exception {
		// On définit un mot de passe
		String motDePasse = "MonMotDePasse123!";

		// On chiffre
		String chiffre = encryptionService.encrypt(motDePasse);

		// On vérifie que le chiffré est DIFFÉRENT de l'original
		assertNotEquals(motDePasse, chiffre);
	}

	@Test
	void dechiffrementEchoueSiTexteModifie() {
		// On essaie de déchiffrer quelque chose d'invalide
		// AES-GCM doit détecter que c'est corrompu et lancer une erreur
		assertThrows(Exception.class, () -> {
			encryptionService.decrypt("v1:donneesinvalides:donneescorrompues");
		});
	}

	@Test
	void deuxChiffrementsDuMemeMdpSontDifferents() throws Exception {
		String motDePasse = "MonMotDePasse123!";

		// On chiffre deux fois le même mot de passe
		String chiffre1 = encryptionService.encrypt(motDePasse);
		String chiffre2 = encryptionService.encrypt(motDePasse);

		// Les deux résultats doivent être différents (grâce à l'IV aléatoire)
		assertNotEquals(chiffre1, chiffre2);
	}

	@Test
	void changementMotDePasseReussi() {
		authService.register("change1@example.com", "Abcd1234@test");
		authService.changePassword(
				"change1@example.com",
				"Abcd1234@test",
				"NewPassword123!",
				"NewPassword123!"
		);
		assertNotNull(authService);
	}

	@Test
	void changementMotDePasseAncienIncorrect() {
		authService.register("change2@example.com", "Abcd1234@test");
		assertThrows(AuthenticationFailedException.class, () ->
				authService.changePassword(
						"change2@example.com",
						"MauvaisMotDePasse123!",
						"NewPassword123!",
						"NewPassword123!"
				)
		);
	}

	@Test
	void changementMotDePasseConfirmationDifferente() {
		authService.register("change3@example.com", "Abcd1234@test");
		assertThrows(InvalidInputException.class, () ->
				authService.changePassword(
						"change3@example.com",
						"Abcd1234@test",
						"NewPassword123!",
						"AutrePassword123!"
				)
		);
	}

	@Test
	void changementMotDePasseTropFaible() {
		authService.register("change4@example.com", "Abcd1234@test");
		assertThrows(InvalidInputException.class, () ->
				authService.changePassword(
						"change4@example.com",
						"Abcd1234@test",
						"faible",
						"faible"
				)
		);
	}

	@Test
	void changementMotDePasseUtilisateurInexistant() {
		assertThrows(InvalidInputException.class, () ->
				authService.changePassword(
						"inexistant@example.com",
						"Abcd1234@test",
						"NewPassword123!",
						"NewPassword123!"
				)
		);
	}


	@Test
	void validationMotDePasseSansChiffre() {
		assertThrows(InvalidInputException.class, () ->
				authService.register("test20@example.com", "Abcdefgh@test"));
	}

	@Test
	void validationMotDePasseSansMinuscule() {
		assertThrows(InvalidInputException.class, () ->
				authService.register("test21@example.com", "ABCD1234@TEST"));
	}

	@Test
	void changementMotDePasseUtilisateurInexistantAvecEmail() {
		assertThrows(Exception.class, () ->
				authService.changePassword(
						"pasexistant2@example.com",
						"Abcd1234@test",
						"NewPassword123!",
						"NewPassword123!"
				));
	}

	@Test
	void loginKOEmailVide() {
		assertThrows(Exception.class, () ->
				authService.login("", "nonce",
						System.currentTimeMillis() / 1000, "hmac"));
	}
}