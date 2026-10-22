// api/auth.js
import Ably from 'ably';

export default async function handler(req, res) {
  const client = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  
  try {
    // Kanal için gerekli yetkileri tanımla
    const tokenRequest = await client.auth.createTokenRequest({
      capability: { '*': ['publish', 'subscribe'] }, // Tüm kanallara yayın yapma ve abone olma izni
    });
    res.status(200).json(tokenRequest);
  } catch (error) {
    res.status(500).json({ error: 'Token oluşturulamadı' });
  }
}