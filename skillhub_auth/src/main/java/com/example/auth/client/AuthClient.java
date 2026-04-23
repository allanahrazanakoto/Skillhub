package com.example.auth.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.RoundRectangle2D;
import java.io.*;
import java.net.*;
import java.util.*;

public class AuthClient extends JFrame {

    private static final Color BG          = new Color(240, 245, 255);
    private static final Color CARD        = Color.WHITE;
    private static final Color ACCENT      = new Color(59, 130, 246);
    private static final Color ACCENT_DARK = new Color(37, 99, 235);
    private static final Color GREEN       = new Color(34, 197, 94);
    private static final Color RED         = new Color(239, 68, 68);
    private static final Color ORANGE      = new Color(251, 146, 60);
    private static final Color TEXT        = new Color(15, 23, 42);
    private static final Color MUTED       = new Color(100, 116, 139);
    private static final Color BORDER      = new Color(203, 213, 225);
    private static final Color INPUT_BG    = new Color(243, 244, 246);

    private CardLayout cardLayout;
    private JPanel mainPanel;

    private JTextField loginEmail;
    private JPasswordField loginPassword;
    private JLabel loginStatus;

    private JTextField registerEmail;
    private JPasswordField registerPassword;
    private JPasswordField registerConfirm;
    private JLabel strengthLabel;
    private JLabel registerStatus;

    private JLabel welcomeLabel;
    private JLabel tokenLabel;
    private JLabel changeStrengthLabel;

    private JTextField changeEmail;
    private JPasswordField changeOldPassword;
    private JPasswordField changeNewPassword;
    private JPasswordField changeConfirmPassword;
    private JLabel changeStatus;

    private String currentToken = null;
    private String currentEmail = null;

    public AuthClient() {
        setTitle("Auth Server");
        setSize(550, 640);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setResizable(true);
        getContentPane().setBackground(BG);
        initUI();
    }

    private void initUI() {
        cardLayout = new CardLayout();
        mainPanel = new JPanel(cardLayout);
        mainPanel.setBackground(BG);
        mainPanel.add(buildLoginScreen(), "login");
        mainPanel.add(buildRegisterScreen(), "register");
        mainPanel.add(buildWelcomeScreen(), "welcome");
        mainPanel.add(buildChangePasswordScreen(), "changePassword");
        add(mainPanel);
        cardLayout.show(mainPanel, "login");
    }

    private JPanel buildLoginScreen() {
        JPanel outer = new JPanel(new GridBagLayout());
        outer.setBackground(BG);

        JPanel card = createCard();
        card.setPreferredSize(new Dimension(460, 460));

        JLabel title = new JLabel("Connexion", SwingConstants.CENTER);
        title.setFont(new Font("Segoe UI", Font.BOLD, 26));
        title.setForeground(TEXT);
        title.setAlignmentX(CENTER_ALIGNMENT);
        card.add(title);

        JLabel sub = new JLabel("Entrez vos identifiants", SwingConstants.CENTER);
        sub.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        sub.setForeground(MUTED);
        sub.setAlignmentX(CENTER_ALIGNMENT);
        card.add(sub);
        card.add(Box.createVerticalStrut(30));

        card.add(makeFieldLabel("Email"));
        card.add(Box.createVerticalStrut(6));
        loginEmail = makeTextField();
        card.add(loginEmail);
        card.add(Box.createVerticalStrut(16));

        card.add(makeFieldLabel("Mot de passe"));
        card.add(Box.createVerticalStrut(6));
        loginPassword = makePasswordField();
        card.add(loginPassword);
        card.add(Box.createVerticalStrut(24));

        JButton loginBtn = makeRoundButton("Se connecter", ACCENT);
        card.add(loginBtn);
        card.add(Box.createVerticalStrut(12));

        JButton goReg = makeLinkButton("Pas de compte ? S'inscrire");
        card.add(goReg);
        card.add(Box.createVerticalStrut(16));

        loginStatus = new JLabel("", SwingConstants.CENTER);
        loginStatus.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        loginStatus.setAlignmentX(CENTER_ALIGNMENT);
        card.add(loginStatus);

        loginBtn.addActionListener(e -> login());
        goReg.addActionListener(e -> cardLayout.show(mainPanel, "register"));

        outer.add(card);
        return outer;
    }

    private JPanel buildRegisterScreen() {
        JPanel outer = new JPanel(new GridBagLayout());
        outer.setBackground(BG);

        JPanel card = createCard();
        card.setPreferredSize(new Dimension(460, 560));

        JLabel title = new JLabel("Créer un compte", SwingConstants.CENTER);
        title.setFont(new Font("Segoe UI", Font.BOLD, 24));
        title.setForeground(TEXT);
        title.setAlignmentX(CENTER_ALIGNMENT);
        card.add(title);

        JLabel sub = new JLabel("Rejoignez-nous maintenant", SwingConstants.CENTER);
        sub.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        sub.setForeground(MUTED);
        sub.setAlignmentX(CENTER_ALIGNMENT);
        card.add(sub);
        card.add(Box.createVerticalStrut(25));

        card.add(makeFieldLabel("Email"));
        card.add(Box.createVerticalStrut(6));
        registerEmail = makeTextField();
        card.add(registerEmail);
        card.add(Box.createVerticalStrut(14));

        card.add(makeFieldLabel("Mot de passe"));
        card.add(Box.createVerticalStrut(6));
        // ✅ MODIFIÉ : champ avec bouton Afficher/Masquer
        registerPassword = makePasswordFieldInner();
        card.add(wrapWithToggle(registerPassword));
        card.add(Box.createVerticalStrut(6));

        strengthLabel = new JLabel("", SwingConstants.LEFT);
        strengthLabel.setFont(new Font("Segoe UI", Font.BOLD, 11));
        strengthLabel.setAlignmentX(LEFT_ALIGNMENT);
        card.add(strengthLabel);
        card.add(Box.createVerticalStrut(14));

        card.add(makeFieldLabel("Confirmer le mot de passe"));
        card.add(Box.createVerticalStrut(6));
        // ✅ MODIFIÉ : champ avec bouton Afficher/Masquer
        registerConfirm = makePasswordFieldInner();
        card.add(wrapWithToggle(registerConfirm));
        card.add(Box.createVerticalStrut(22));

        JButton regBtn = makeRoundButton("Créer mon compte", GREEN);
        card.add(regBtn);
        card.add(Box.createVerticalStrut(12));

        JButton goLogin = makeLinkButton("Déjà inscrit ? Se connecter");
        card.add(goLogin);
        card.add(Box.createVerticalStrut(12));

        registerStatus = new JLabel("", SwingConstants.CENTER);
        registerStatus.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        registerStatus.setAlignmentX(CENTER_ALIGNMENT);
        card.add(registerStatus);

        registerPassword.addKeyListener(new KeyAdapter() {
            @Override public void keyReleased(KeyEvent e) { updateStrength(); }
        });

        regBtn.addActionListener(e -> register());
        goLogin.addActionListener(e -> cardLayout.show(mainPanel, "login"));

        outer.add(card);
        return outer;
    }

    private JPanel buildWelcomeScreen() {
        JPanel outer = new JPanel(new GridBagLayout());
        outer.setBackground(BG);

        JPanel card = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(CARD);
                g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), 20, 20));
                g2.setColor(new Color(34, 197, 94, 60));
                g2.setStroke(new BasicStroke(1.5f));
                g2.draw(new RoundRectangle2D.Float(0, 0, getWidth() - 1, getHeight() - 1, 20, 20));
                g2.dispose();
            }
        };
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setOpaque(false);
        card.setBorder(new EmptyBorder(40, 20, 40, 20));
        card.setPreferredSize(new Dimension(460, 460));

        JLabel check = new JLabel("", SwingConstants.CENTER);
        check.setFont(new Font("Segoe UI", Font.BOLD, 56));
        check.setForeground(GREEN);
        check.setAlignmentX(CENTER_ALIGNMENT);
        card.add(check);
        card.add(Box.createVerticalStrut(15));

        welcomeLabel = new JLabel("", SwingConstants.CENTER);
        welcomeLabel.setFont(new Font("Segoe UI", Font.BOLD, 18));
        welcomeLabel.setForeground(TEXT);
        welcomeLabel.setAlignmentX(CENTER_ALIGNMENT);
        card.add(welcomeLabel);
        card.add(Box.createVerticalStrut(8));

        tokenLabel = new JLabel("Vous etes connecte avec succes", SwingConstants.CENTER);
        tokenLabel.setFont(new Font("Segoe UI", Font.PLAIN, 15));
        tokenLabel.setForeground(MUTED);
        tokenLabel.setAlignmentX(CENTER_ALIGNMENT);
        card.add(tokenLabel);
        card.add(Box.createVerticalStrut(30));

        JButton changeBtn = makeRoundButton("Changer mon mot de passe", ACCENT);
        card.add(changeBtn);
        card.add(Box.createVerticalStrut(12));

        JButton logout = makeRoundButton("Se deconnecter", new Color(60, 60, 80));
        card.add(logout);

        changeBtn.addActionListener(e -> {
            if (currentEmail != null) {
                changeEmail.setText(currentEmail);
            }
            changeStatus.setText("");
            changeOldPassword.setText("");
            changeNewPassword.setText("");
            changeConfirmPassword.setText("");
            cardLayout.show(mainPanel, "changePassword");
        });

        logout.addActionListener(e -> {
            currentToken = null;
            currentEmail = null;
            loginEmail.setText("");
            loginPassword.setText("");
            cardLayout.show(mainPanel, "login");
        });

        outer.add(card);
        return outer;
    }

    private JPanel buildChangePasswordScreen() {
        JPanel outer = new JPanel(new GridBagLayout());
        outer.setBackground(BG);

        JPanel card = createCard();
        card.setPreferredSize(new Dimension(460, 560));

        JLabel title = new JLabel("Changer le mot de passe", SwingConstants.CENTER);
        title.setFont(new Font("Segoe UI", Font.BOLD, 22));
        title.setForeground(TEXT);
        title.setAlignmentX(CENTER_ALIGNMENT);
        card.add(title);

        JLabel sub = new JLabel("Modifiez votre mot de passe", SwingConstants.CENTER);
        sub.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        sub.setForeground(MUTED);
        sub.setAlignmentX(CENTER_ALIGNMENT);
        card.add(sub);
        card.add(Box.createVerticalStrut(25));

        card.add(makeFieldLabel("Email"));
        card.add(Box.createVerticalStrut(6));
        changeEmail = makeTextField();
        card.add(changeEmail);
        card.add(Box.createVerticalStrut(14));

        card.add(makeFieldLabel("Ancien mot de passe"));
        card.add(Box.createVerticalStrut(6));
        // ✅ MODIFIÉ : champ avec bouton Afficher/Masquer
        changeOldPassword = makePasswordFieldInner();
        card.add(wrapWithToggle(changeOldPassword));
        card.add(Box.createVerticalStrut(14));

        card.add(makeFieldLabel("Nouveau mot de passe"));
        card.add(Box.createVerticalStrut(6));
        // ✅ MODIFIÉ : champ avec bouton Afficher/Masquer
        changeNewPassword = makePasswordFieldInner();
        card.add(wrapWithToggle(changeNewPassword));
        card.add(Box.createVerticalStrut(6));

        changeStrengthLabel = new JLabel("", SwingConstants.LEFT);
        changeStrengthLabel.setFont(new Font("Segoe UI", Font.BOLD, 11));
        changeStrengthLabel.setAlignmentX(LEFT_ALIGNMENT);
        card.add(changeStrengthLabel);
        card.add(Box.createVerticalStrut(14));

        changeNewPassword.addKeyListener(new KeyAdapter() {
            @Override public void keyReleased(KeyEvent e) { updateStrengthChange(); }
        });

        card.add(makeFieldLabel("Confirmer le nouveau mot de passe"));
        card.add(Box.createVerticalStrut(6));
        // ✅ MODIFIÉ : champ avec bouton Afficher/Masquer
        changeConfirmPassword = makePasswordFieldInner();
        card.add(wrapWithToggle(changeConfirmPassword));
        card.add(Box.createVerticalStrut(22));

        JButton confirmBtn = makeRoundButton("Confirmer le changement", GREEN);
        card.add(confirmBtn);
        card.add(Box.createVerticalStrut(12));

        JButton goBack = makeLinkButton("Retour");
        card.add(goBack);
        card.add(Box.createVerticalStrut(12));

        changeStatus = new JLabel("", SwingConstants.CENTER);
        changeStatus.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        changeStatus.setAlignmentX(CENTER_ALIGNMENT);
        card.add(changeStatus);

        confirmBtn.addActionListener(e -> changePassword());
        goBack.addActionListener(e -> cardLayout.show(mainPanel, "welcome"));

        outer.add(card);
        return outer;
    }
    private void updateStrengthChange() {
        String p = new String(changeNewPassword.getPassword());
        if (p.isEmpty()) { changeStrengthLabel.setText(""); return; }
        boolean ok = p.length() >= 12
                && p.chars().anyMatch(Character::isUpperCase)
                && p.chars().anyMatch(Character::isLowerCase)
                && p.chars().anyMatch(Character::isDigit)
                && p.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        if (!ok) {
            changeStrengthLabel.setText("Non conforme");
            changeStrengthLabel.setForeground(RED);
        } else if (p.length() < 16) {
            changeStrengthLabel.setText("Conforme mais faible");
            changeStrengthLabel.setForeground(ORANGE);
        } else {
            changeStrengthLabel.setText("Fort");
            changeStrengthLabel.setForeground(GREEN);
        }
    }
    private JPanel createCard() {
        JPanel card = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(CARD);
                g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), 20, 20));
                g2.setColor(BORDER);
                g2.setStroke(new BasicStroke(1));
                g2.draw(new RoundRectangle2D.Float(0, 0, getWidth() - 1, getHeight() - 1, 20, 20));
                g2.dispose();
            }
        };
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setOpaque(false);
        card.setBorder(new EmptyBorder(40, 40, 40, 40));
        return card;
    }

    // ✅ NOUVELLE MÉTHODE : champ mot de passe sans bordure propre (utilisé dans wrapWithToggle)
    private JPasswordField makePasswordFieldInner() {
        JPasswordField f = new JPasswordField();
        f.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        f.setForeground(TEXT);
        f.setCaretColor(ACCENT);
        f.setOpaque(false);
        f.setBorder(new EmptyBorder(10, 14, 10, 4));
        return f;
    }

    // ✅ NOUVELLE MÉTHODE : enveloppe le champ avec un bouton Afficher/Masquer à droite
    private JPanel wrapWithToggle(JPasswordField field) {
        JPanel wrapper = new JPanel(new BorderLayout()) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(INPUT_BG);
                g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), 10, 10));
                g2.dispose();
                super.paintComponent(g);
            }
        };
        wrapper.setOpaque(false);
        wrapper.setBorder(new CompoundBorder(
                new LineBorder(BORDER, 1, true),
                new EmptyBorder(0, 0, 0, 0)));
        wrapper.setMaximumSize(new Dimension(Integer.MAX_VALUE, 50));
        wrapper.setAlignmentX(Component.CENTER_ALIGNMENT);

        JButton toggleBtn = new JButton("Afficher");
        toggleBtn.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        toggleBtn.setForeground(ACCENT);
        toggleBtn.setContentAreaFilled(false);
        toggleBtn.setBorderPainted(false);
        toggleBtn.setFocusPainted(false);
        toggleBtn.setOpaque(false);
        toggleBtn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        toggleBtn.setPreferredSize(new Dimension(90, 50));

        boolean[] shown = {false};
        toggleBtn.addActionListener(e -> {
            shown[0] = !shown[0];
            field.setEchoChar(shown[0] ? (char) 0 : '\u2022');
            toggleBtn.setText(shown[0] ? "Masquer" : "Afficher");
        });

        wrapper.add(field, BorderLayout.CENTER);
        wrapper.add(toggleBtn, BorderLayout.EAST);
        return wrapper;
    }

    private void updateStrength() {
        String p = new String(registerPassword.getPassword());
        if (p.isEmpty()) { strengthLabel.setText(""); return; }
        boolean ok = p.length() >= 12
                && p.chars().anyMatch(Character::isUpperCase)
                && p.chars().anyMatch(Character::isLowerCase)
                && p.chars().anyMatch(Character::isDigit)
                && p.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        if (!ok) {
            strengthLabel.setText("Non conforme");
            strengthLabel.setForeground(RED);
        } else if (p.length() < 16) {
            strengthLabel.setText("Conforme mais faible");
            strengthLabel.setForeground(ORANGE);
        } else {
            strengthLabel.setText("Fort");
            strengthLabel.setForeground(GREEN);
        }
    }

    private void register() {
        String email = registerEmail.getText().trim();
        String pass = new String(registerPassword.getPassword());
        String confirm = new String(registerConfirm.getPassword());
        if (!pass.equals(confirm)) {
            registerStatus.setText("Les mots de passe ne correspondent pas");
            registerStatus.setForeground(RED);
            return;
        }
        try {
            sendPost("http://localhost:8080/api/auth/register"
                    + "?email=" + email + "&password=" + pass);
            registerStatus.setText("Inscription reussie !");
            registerStatus.setForeground(GREEN);
        } catch (Exception ex) {
            registerStatus.setText("Erreur lors de l'inscription");
            registerStatus.setForeground(RED);
        }
    }

    private void login() {
        String email = loginEmail.getText().trim();
        String pass = new String(loginPassword.getPassword());
        try {
            String nonce = UUID.randomUUID().toString();
            long ts = System.currentTimeMillis() / 1000;
            String msg = email + ":" + nonce + ":" + ts;
            String hmac = computeHmac(pass, msg);
            String json = new ObjectMapper().writeValueAsString(Map.of(
                    "email", email, "nonce", nonce,
                    "timestamp", String.valueOf(ts), "hmac", hmac));
            String resp = sendPostJson("http://localhost:8080/api/auth/login", json);
            Map<?, ?> result = new ObjectMapper().readValue(resp, Map.class);
            currentToken = (String) result.get("accessToken");
            currentEmail = email;
            String me = sendGet("http://localhost:8080/api/me", currentToken);
            welcomeLabel.setText(me);
            tokenLabel.setText("Token : " + currentToken);
            cardLayout.show(mainPanel, "welcome");
        } catch (Exception ex) {
            loginStatus.setText("Email ou mot de passe incorrect");
            loginStatus.setForeground(RED);
        }
    }

    private void changePassword() {
        String email = changeEmail.getText().trim();
        String oldPass = new String(changeOldPassword.getPassword());
        String newPass = new String(changeNewPassword.getPassword());
        String confirmPass = new String(changeConfirmPassword.getPassword());
        try {
            String json = new ObjectMapper().writeValueAsString(Map.of(
                    "email", email,
                    "oldPassword", oldPass,
                    "newPassword", newPass,
                    "confirmPassword", confirmPass
            ));
            sendPutJson("http://localhost:8080/api/auth/change-password", json);
            changeStatus.setText("Mot de passe changé avec succès !");
            changeStatus.setForeground(GREEN);
            changeOldPassword.setText("");
            changeNewPassword.setText("");
            changeConfirmPassword.setText("");
        } catch (Exception ex) {
            changeStatus.setText("Erreur : vérifiez vos informations");
            changeStatus.setForeground(RED);
        }
    }

    private String computeHmac(String key, String message) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(message.getBytes()));
    }

    private JPanel makeFieldLabel(String text) {
        JLabel l = new JLabel(text);
        l.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        l.setForeground(MUTED);
        JPanel p = new JPanel(new BorderLayout());
        p.setOpaque(false);
        p.setMaximumSize(new Dimension(Integer.MAX_VALUE, 20));
        p.setAlignmentX(Component.CENTER_ALIGNMENT); // même alignement que les champs
        p.add(l, BorderLayout.WEST); // texte collé à gauche dans le panel
        return p;
    }

    private JTextField makeTextField() {
        JTextField f = new JTextField() {
            @Override protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(INPUT_BG);
                g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), 10, 10));
                g2.dispose();
                super.paintComponent(g);
            }
        };
        f.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        f.setForeground(TEXT);
        f.setCaretColor(ACCENT);
        f.setOpaque(false);
        f.setBorder(new CompoundBorder(
                new LineBorder(BORDER, 1, true),
                new EmptyBorder(10, 14, 10, 14)));
        f.setMaximumSize(new Dimension(Integer.MAX_VALUE, 50));
        f.setAlignmentX(Component.CENTER_ALIGNMENT);
        return f;
    }

    private JPasswordField makePasswordField() {
        JPasswordField f = new JPasswordField() {
            @Override protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(INPUT_BG);
                g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), 10, 10));
                g2.dispose();
                super.paintComponent(g);
            }
        };
        f.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        f.setForeground(TEXT);
        f.setCaretColor(ACCENT);
        f.setOpaque(false);
        f.setBorder(new CompoundBorder(
                new LineBorder(BORDER, 1, true),
                new EmptyBorder(10, 14, 10, 14)));
        f.setMaximumSize(new Dimension(Integer.MAX_VALUE, 50));
        f.setAlignmentX(Component.CENTER_ALIGNMENT);
        return f;
    }

    private JButton makeRoundButton(String text, Color color) {
        JButton btn = new JButton(text) {
            @Override protected void paintComponent(Graphics g) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(getModel().isPressed() ? color.darker() :
                        getModel().isRollover() ? color.brighter() : color);
                g2.fill(new RoundRectangle2D.Float(0, 0, getWidth(), getHeight(), 12, 12));
                g2.dispose();
                super.paintComponent(g);
            }
        };
        btn.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btn.setForeground(Color.WHITE);
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 46));
        btn.setAlignmentX(LEFT_ALIGNMENT);
        return btn;
    }

    private JButton makeLinkButton(String text) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btn.setForeground(ACCENT);
        btn.setContentAreaFilled(false);
        btn.setBorderPainted(false);
        btn.setFocusPainted(false);
        btn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        btn.setAlignmentX(CENTER_ALIGNMENT);
        return btn;
    }

    private String sendPost(String urlStr) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        int code = conn.getResponseCode();
        BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    private String sendPostJson(String urlStr, String jsonBody) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) { os.write(jsonBody.getBytes()); }
        int code = conn.getResponseCode();
        BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    private String sendPutJson(String urlStr, String jsonBody) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("PUT");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonBody.getBytes());
        }
        int code = conn.getResponseCode();
        BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        if (code >= 400) throw new Exception("Erreur serveur");
        return sb.toString();
    }

    private String sendGet(String urlStr, String token) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        if (token != null) conn.setRequestProperty("Authorization", token);
        BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new AuthClient().setVisible(true));
    }
}