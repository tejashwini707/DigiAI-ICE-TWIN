import Personnel from "../models/Personnel.js";
import dataStore from "../services/dataStore.js";

export async function listPersonnel(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();

  try {
    if (Personnel.db && Personnel.db.readyState === 1) {
      const crew = await Personnel.find({ stationCode }).sort({ name: 1 });
      if (crew && crew.length > 0) return res.json(crew);
    }
  } catch {
    // fallback
  }

  res.json(dataStore.getPersonnel(stationCode));
}

export async function updatePersonnel(req, res) {
  const { id } = req.params;
  const updated = dataStore.updatePersonnel(id, req.body);

  try {
    if (Personnel.db && Personnel.db.readyState === 1) {
      await Personnel.findByIdAndUpdate(id, req.body, { new: true });
    }
  } catch {
    // safe
  }

  if (!updated) return res.status(404).json({ error: "Personnel not found" });
  res.json(updated);
}

export async function raiseSOS(req, res) {
  const { id } = req.params;
  const result = dataStore.raiseSOS(id);

  try {
    if (Personnel.db && Personnel.db.readyState === 1) {
      await Personnel.findByIdAndUpdate(
        id,
        { healthStatus: "critical", lastCheckInAt: new Date() },
        { new: true }
      );
    }
  } catch {
    // safe
  }

  if (!result) return res.status(404).json({ error: "Personnel not found" });
  res.json(result.person);
}
