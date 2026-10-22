// api/auth.js
import Ably from 'ably';

export default async function handler(req, res) {
  const apiKey = process.env.ABLY_API_KEY || "Abi6Q.Rt2PLQ:YDuEZdqR3TuIyJCIwNjLqcfzVdGzHSsX4hupXlrrLfE";
  const client = new Ably.Rest({ key: apiKey, queryTime: true });
  
  // 🆕 Tarayıcıdan gelen clientId'yi al (GET isteğinin query parametresinden)
  const requestedClientId = req.query.clientId;

  try {
    const tokenRequest = await client.auth.createTokenRequest({
      capability: { '*': ['publish', 'subscribe'] },
      // 🆕 clientId'yi token talebine ekle
      clientId: requestedClientId 
    });
    res.status(200).json(tokenRequest);
  } catch (error) {
    console.error("Ably Hatası:", error);
    res.status(500).json({ error: 'Token oluşturulamadı' });
  }
}