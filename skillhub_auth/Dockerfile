# ============================================================
# STAGE 1 — BUILDER
# On utilise Maven + Java 21 pour compiler le code source en JAR
# Cette image ne sera PAS dans l'image finale (build multi-stage)
# ============================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

# On se place dans le dossier de travail à l'intérieur du conteneur
WORKDIR /app

# On copie d'abord uniquement le pom.xml pour télécharger les dépendances
# (optimisation : si le code change mais pas le pom.xml, les dépendances restent en cache)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# On copie ensuite tout le code source
COPY src ./src

# On compile le projet et on crée le JAR (sans lancer les tests ici)
RUN mvn package -DskipTests -q

# ============================================================
# STAGE 2 — RUNTIME
# On part d'une image Java 21 légère (jre = juste ce qu'il faut pour exécuter)
# On ne prend que le JAR produit par le stage builder
# ============================================================
FROM eclipse-temurin:21-jre-alpine

# On se place dans le dossier de travail
WORKDIR /app

# On copie UNIQUEMENT le JAR depuis le stage builder
# → l'image finale ne contient pas Maven ni le code source
COPY --from=builder /app/target/auth-0.0.1-SNAPSHOT.jar app.jar

# On expose le port 8080 sur lequel Spring Boot écoute
EXPOSE 8080

# On démarre l'application Java
CMD ["java", "-jar", "app.jar"]