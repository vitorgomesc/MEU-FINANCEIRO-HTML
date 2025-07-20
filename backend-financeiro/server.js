// backend-financeiro/server.js
const http = require('http');
const xlsx = require('xlsx');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.url !== '/') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  const filePath = path.join(__dirname, 'Controle_financeiro copy.xlsx');

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erro ao ler o Excel: ' + error.message);
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});