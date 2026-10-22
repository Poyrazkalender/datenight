import Ably from 'ably';

export default async function handler(req, res) {
  // Eğer process.env okunamazsa, yedek olarak buradaki anahtarı kullan (Sadece yerel test için)
  const apiKey = process.env.ABLY_API_KEY || "Abi6Q.Rt2PLQ:YDuEZdqR3TuIyJCIwNjLqcfzVdGzHSsX4hupXlrrLfE";
  
  console.log("Kullanılan API Key:", apiKey ? "Başarıyla Yüklendi" : "Bulunamadı");

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key yok' });
  }

  const client = new Ably.Rest({ 
    key: apiKey,
    queryTime: true 
  });
  
  try {
    const tokenRequest = await client.auth.createTokenRequest({
      capability: { '*': ['publish', 'subscribe'] },
    });
    res.status(200).json(tokenRequest);
  } catch (error) {
    console.error("Ably Token Hatası:", error);
    res.status(500).json({ error: 'Token oluşturulamadı' });
  }
}