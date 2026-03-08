require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./base_datos/db");

async function seed() {
  try {
    const lista = [
      { usuario: "mavac_gabriel", password: "ñHttpOficialRiqueszas77777ñ" },
      { usuario: "mavac_enrique", password: "ñHttpOficialCobTechRiquezas44444ñ" },
      { usuario: "mavac_gabriela", password: "X$$#super777%ff"},
      { usuario: "mavac_gerencia", password: "X$##super7147%#f"},
      { usuario: "mavac_fernando", password: "X77ExitoDorada77X"},
    ];

    // Limpia la tabla para que no se duplique (opcional pero recomendado para pruebas)
    await pool.query("TRUNCATE TABLE credenciales RESTART IDENTITY;");

    for (const item of lista) {
      const hash = await bcrypt.hash(item.password, 10);

      await pool.query(
        "INSERT INTO credenciales (usuario, password_hash) VALUES ($1, $2)",
        [item.usuario, hash]
      );
    }

    console.log("✅ Credenciales insertadas con bcrypt.");
  } catch (err) {
    console.error("❌ Error seed:", err);
  } finally {
    await pool.end();
  }
}

seed();
