const { askGemini } = require('../services/gemini.service');
const { ChatHistory } = require('../models');
const sendResponse = require('../utils/response');

async function chat(req, res) {
  try {
    const { message, saveHistory } = req.body;

    const reply = await askGemini(message);

    // Riwayat cuma disimpen kalo user EXPLICIT setuju (saveHistory === true).
    // Default-nya gak nyimpen apa-apa, biar sesuai prinsip "opt-in".
    if (saveHistory === true) {
      // Sentuh session biar express-session nge-generate & nyimpen cookie
      // sessionID-nya (default-nya session gak disave kalo gak ada perubahan,
      // karena saveUninitialized: false di app.js).
      req.session.historyEnabled = true;

      await ChatHistory.create({
        sessionId: req.sessionID,
        message,
        reply,
      });
    }

    return sendResponse(res, {
      message: 'Berhasil dapat balasan',
      data: { reply, historySaved: saveHistory === true },
    });
  } catch (err) {
    console.error('Gemini error:', err.message);
    return sendResponse(res, {
      code: 500,
      success: false,
      message: 'Gagal menghubungi AI, coba lagi nanti',
    });
  }
}

/**
 * Ambil kembali riwayat percakapan milik session yang sedang aktif
 * (browser/device yang sama). Kalo user belum pernah setuju nyimpen
 * riwayat, hasilnya array kosong, bukan error.
 */
async function getHistory(req, res) {
  try {
    const histories = await ChatHistory.findAll({
      where: { sessionId: req.sessionID },
      order: [['createdAt', 'ASC']],
    });

    return sendResponse(res, {
      message: 'Berhasil ambil riwayat percakapan',
      data: histories,
    });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

module.exports = { chat, getHistory };
