
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// Configuração da comunicação USB com o ESP32
const port = new SerialPort({
  path: "COM3",
  baudRate: 115200,
});

const parser = port.pipe(
  new ReadlineParser({ delimiter: "\n" })
);

console.log("CULTIVIS - LEITOR SERIAL");
console.log("Aguardando dados do ESP32...");

port.on("open", () => {
  console.log("ESP32 conectado pela porta USB!");
});

port.on("error", (erro) => {
  console.error("Erro na comunicação serial:", erro.message);
});

parser.on("data", async (linha) => {
  const mensagem = linha.trim();

  if (!mensagem.startsWith("{")) {
    return;
  }

  try {
    const dados = JSON.parse(mensagem);

    console.log("Leitura recebida:", dados);

    const resposta = await fetch(
      "http://localhost:3000/api/leituras",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      }
    );

    if (resposta.ok) {
      console.log("Dados enviados ao servidor Node.js!");
    } else {
      console.error("Erro HTTP:", resposta.status);
    }

  } catch (erro) {
    console.error("Erro ao processar leitura:", erro.message);
  }
});
