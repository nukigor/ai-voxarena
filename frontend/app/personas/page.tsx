"use client";

import { useState, useEffect } from "react";
import type { Persona } from "@prisma/client"; // ✅ Import generated type

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]); // ✅ Strongly typed
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/personas")
      .then((res) => res.json())
      .then((data: Persona[]) => setPersonas(data)); // ✅ Type annotation
  }, []);

  async function createPersona() {
    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const newPersona: Persona = await res.json(); // ✅ Typed response
    setPersonas([...personas, newPersona]);
    setName("");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Persona Builder</h1>

      <div className="mb-6">
        <input
          type="text"
          value={name}
          placeholder="Persona name"
          onChange={(e) => setName(e.target.value)}
          className="border px-2 py-1 mr-2"
        />
        <button
          onClick={createPersona}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Add Persona
        </button>
      </div>

      <ul className="space-y-2">
        {personas.map((p) => (
          <li key={p.id} className="border p-2 rounded">
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}