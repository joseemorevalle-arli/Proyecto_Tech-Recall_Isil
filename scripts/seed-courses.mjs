// Crea cursos de prueba en los EMULADORES para probar la HU07 mientras la HU06 no esté integrada.
// Uso (con `npm run emulators` corriendo y la cuenta ya creada en /crear-cuenta):
//   npm run seed:cursos -- correo@mail.isil.pe
// Siempre apunta a los emuladores: no puede escribir en un proyecto real de Firebase.
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email) {
  console.error("Indica el correo de la cuenta: npm run seed:cursos -- correo@mail.isil.pe");
  process.exit(1);
}

const app = initializeApp({ projectId: "demo-recall-isil" });

// Datos ficticios con la forma de src/lib/courses/schema.ts
const sampleCourses = [
  {
    name: "Curso de prueba A",
    units: [
      {
        number: 1,
        title: "Unidad de prueba 1",
        sessions: [
          { number: 1, title: "Sesión de prueba 1" },
          { number: 2, title: "Sesión de prueba 2" },
        ],
      },
      {
        number: 2,
        title: "Unidad de prueba 2",
        sessions: [{ number: 3, title: "Sesión de prueba 3" }],
      },
    ],
  },
  {
    name: "Curso de prueba B",
    units: [
      {
        number: 1,
        title: "Unidad de prueba 1",
        sessions: [{ number: 1, title: "Sesión de prueba 1" }],
      },
    ],
  },
];

const user = await getAuth(app).getUserByEmail(email);
const courses = getFirestore(app).collection("users").doc(user.uid).collection("courses");

for (const course of sampleCourses) {
  const ref = await courses.add({ ...course, createdAt: FieldValue.serverTimestamp() });
  console.log(`${course.name}: http://localhost:3000/cursos/${ref.id}`);
}
