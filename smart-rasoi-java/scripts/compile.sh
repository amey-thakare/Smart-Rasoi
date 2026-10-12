#!/usr/bin/env bash
# ====================================================================
# SMART RASOI — ACADEMIC JAVA COMPILATION SCRIPT
# ====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "================================================================================"
echo "  SMART RASOI — COMPILING JAVA ACADEMIC MODULES"
echo "================================================================================"
echo "Root Java Directory: ${ROOT_DIR}"

# Check for javac
if ! command -v javac &> /dev/null; then
    echo ""
    echo "⚠️  [PREREQUISITE NOTICE] javac command not found in current PATH."
    echo "To compile this academic layer on macOS:"
    echo "  1. Install OpenJDK 17 or 21: brew install openjdk@17"
    echo "  2. Link JDK: sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
    echo "  3. Set JAVA_HOME: export JAVA_HOME=\$(/usr/libexec/java_home -v 17)"
    echo "  4. Add to PATH: export PATH=\"\$JAVA_HOME/bin:\$PATH\""
    echo ""
    exit 0
fi

BIN_DIR="${ROOT_DIR}/bin"
LIB_DIR="${ROOT_DIR}/lib"
mkdir -p "${BIN_DIR}"
mkdir -p "${LIB_DIR}"

# 1. Compile Core Module (Units 1-4: Pure Standard JDK - Zero External Dependencies)
echo ""
echo "[1/4] Compiling Core Module (Units 1 - 4: OOP, Exceptions, Collections, Files)..."
CORE_SOURCES=$(find "${ROOT_DIR}/core/src" -name "*.java")
javac -d "${BIN_DIR}" -sourcepath "${ROOT_DIR}/core/src" ${CORE_SOURCES}
echo "✅ Core module compiled successfully into ${BIN_DIR}."

# 2. Compile Database Module (Unit 5: JDBC Persistence)
echo ""
echo "[2/4] Compiling Database Module (Unit 5: JDBC & SQLite)..."
DB_SOURCES=$(find "${ROOT_DIR}/database/src" -name "*.java")
CP_FLAG="${BIN_DIR}"
if [ -f "${LIB_DIR}/sqlite-jdbc.jar" ]; then
    CP_FLAG="${CP_FLAG}:${LIB_DIR}/sqlite-jdbc.jar"
fi
javac -d "${BIN_DIR}" -cp "${CP_FLAG}" -sourcepath "${ROOT_DIR}/database/src:${ROOT_DIR}/core/src" ${DB_SOURCES}
echo "✅ Database module compiled successfully."

# 3. Compile Desktop JavaFX Module (Unit 5 & Requirement 12)
echo ""
echo "[3/4] Compiling Desktop JavaFX Module..."
DESKTOP_SOURCES=$(find "${ROOT_DIR}/desktop/src" -name "*.java")
if [ -n "${JAVAFX_HOME}" ] && [ -d "${JAVAFX_HOME}/lib" ]; then
    javac -d "${BIN_DIR}" --module-path "${JAVAFX_HOME}/lib" --add-modules javafx.controls,javafx.fxml \
          -cp "${BIN_DIR}" -sourcepath "${ROOT_DIR}/desktop/src:${ROOT_DIR}/core/src:${ROOT_DIR}/database/src" ${DESKTOP_SOURCES}
    echo "✅ JavaFX Desktop module compiled successfully."
else
    echo "ℹ️  Note: JAVAFX_HOME not set. To compile JavaFX Desktop module:"
    echo "     export JAVAFX_HOME=/path/to/javafx-sdk-17/lib"
    echo "     Skipping JavaFX compilation for now."
fi

# 4. Compile Web Servlets Module (Units 6 & 7)
echo ""
echo "[4/4] Compiling Web Servlets Module (Units 6 & 7)..."
WEB_SOURCES=$(find "${ROOT_DIR}/web/src" -name "*.java")
if [ -f "${LIB_DIR}/servlet-api.jar" ] || [ -f "${LIB_DIR}/javax.servlet-api.jar" ] || [ -n "${CATALINA_HOME}" ]; then
    SERVLET_CP="${BIN_DIR}"
    if [ -n "${CATALINA_HOME}" ]; then
        SERVLET_CP="${SERVLET_CP}:${CATALINA_HOME}/lib/servlet-api.jar:${CATALINA_HOME}/lib/jsp-api.jar"
    elif [ -f "${LIB_DIR}/javax.servlet-api.jar" ]; then
        SERVLET_CP="${SERVLET_CP}:${LIB_DIR}/javax.servlet-api.jar"
    fi
    javac -d "${BIN_DIR}" -cp "${SERVLET_CP}" -sourcepath "${ROOT_DIR}/web/src:${ROOT_DIR}/core/src:${ROOT_DIR}/database/src" ${WEB_SOURCES}
    echo "✅ Web Servlets module compiled successfully."
else
    echo "ℹ️  Note: servlet-api.jar or CATALINA_HOME not detected."
    echo "     To compile Servlets: place javax.servlet-api-4.0.1.jar in ${LIB_DIR}/ or set CATALINA_HOME."
fi

echo ""
echo "================================================================================"
echo "  COMPILATION SCRIPT FINISHED!"
echo "================================================================================"
