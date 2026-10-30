
require("dotenv").config();

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { createClient } = require("@supabase/supabase-js");

// SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PORTA SERIAL DO ESP32
const port = new SerialPort({
  path: "COM3",
  baudRate: 115200,
});

const parser = port.pipe(
  new ReadlineParser({ delimiter: "\n" })
);

// INICIALIZAÇÃO
console.log("CULTIVIS - LEITOR SERIAL");
console.log("Aguardando dados do ESP32...");

port.on("open", () => {
  console.log("ESP32 conectado pela porta USB!");
});

port.on("error", (erro) => {
  console.error("ERRO SERIAL:", erro.message);
});

// VARIÁVEIS DOS SENSORES
let temperatura = null;
let umidade = null;
let ph = null;

// CONTROLE DE ENVIO
const INTERVALO_ENVIO = 60 * 1000; // 60 segundos
let ultimoEnvio = Date.now();
let enviando = false;

// FUNÇÃO PARA ENVIAR AO SUPABASE
async function enviarSupabase() {
  enviando = true;
  ultimoEnvio = Date.now();

  console.log("Enviando leitura ao Supabase...");

  try {
    const { error } = await supabase
      .from("leituras_sensores")
      .insert({
        sensor_id: 1,
        valortemp: temperatura,
        valorhumidade: umidade,
        valorph: ph,
        data_hora: new Date().toISOString(),
      });

    if (error) {
      console.error("ERRO SUPABASE:", error.message);
      return;
    }

    console.log("LEITURA ENVIADA COM SUCESSO!");
    console.log("Temperatura:", temperatura);
    console.log("Umidade:", umidade);
    console.log("pH:", ph);
    console.log("Próximo envio permitido em 60 segundos.");

  } catch (erro) {
    console.error("ERRO AO ENVIAR:", erro.message);

  } finally {
    enviando = false;
  }
}

// RECEBIMENTO DOS DADOS DO ESP32
parser.on("data", async (linha) => {
  const mensagem = linha.trim();

  console.log("SERIAL:", mensagem);

  // TEMPERATURA E UMIDADE
  const leituraAmbiente = mensagem.match(
    /Temperatura:\s*([\d.,]+)\s*C\s*\|\s*Umidade:\s*([\d.,]+)\s*%/i
  );

  if (leituraAmbiente) {
    temperatura = Number(
      leituraAmbiente[1].replace(",", ".")
    );

    umidade = Number(
      leituraAmbiente[2].replace(",", ".")
    );
  }

  // pH
  const leituraPH = mensagem.match(/pH:\s*([\d.,]+)/i);

  if (leituraPH) {
    const valorPH = Number(
      leituraPH[1].replace(",", ".")
    );

    if (Number.isFinite(valorPH)) {
      ph = valorPH;
    }
  }

  // VERIFICA SE JÁ PODE ENVIAR
  const intervaloCompleto =
    Date.now() - ultimoEnvio >= INTERVALO_ENVIO;

  if (
    temperatura !== null &&
    umidade !== null &&
    intervaloCompleto &&
    !enviando
  ) {
    await enviarSupabase();
  }
});
