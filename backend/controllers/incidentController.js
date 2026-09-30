import Incident from "../models/Incident.js";
import dataStore from "../services/dataStore.js";

export async function listIncidents(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();

  try {
    if (Incident.db && Incident.db.readyState === 1) {
      const incidents = await Incident.find({ stationCode }).sort({ createdAt: -1 });
      if (incidents && incidents.length > 0) return res.json(incidents);
    }
  } catch {
    // fallback
  }

  const memoryIncidents = dataStore.getIncidents(stationCode);
  res.json(memoryIncidents);
}

export async function createIncident(req, res) {
  const { code } = req.params;
  const stationCode = code.toUpperCase();

  const newIncident = dataStore.addIncident(stationCode, req.body);

  try {
    if (Incident.db && Incident.db.readyState === 1) {
      if (req.body.clientId) {
        await Incident.findOneAndUpdate(
          { clientId: req.body.clientId },
          { ...req.body, stationCode },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } else {
        await Incident.create({ ...req.body, stationCode });
      }
    }
  } catch {
    // safe in memory
  }

  res.status(201).json(newIncident);
}

export async function updateIncident(req, res) {
  const { id } = req.params;
  const updated = dataStore.updateIncident(id, req.body);

  try {
    if (Incident.db && Incident.db.readyState === 1) {
      await Incident.findByIdAndUpdate(id, req.body, { new: true });
    }
  } catch {
    // safe
  }

  if (!updated) return res.status(404).json({ error: "Incident not found" });
  res.json(updated);
}
