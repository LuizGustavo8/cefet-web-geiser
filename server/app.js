// importação de dependência(s)
import express from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// variáveis globais deste módulo
const PORT = 3000
const db = {}

const app = express()

// carregar "banco de dados" (data/jogadores.json e data/jogosPorJogador.json)
db.jogadores = JSON.parse(readFileSync(path.join(__dirname, 'data', 'jogadores.json'), 'utf-8'))
db.jogosPorJogador = JSON.parse(readFileSync(path.join(__dirname, 'data', 'jogosPorJogador.json'), 'utf-8'))

// configurar qual templating engine usar (hbs - handlebars)
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))


// EXERCÍCIO 2
// definir rota para página inicial --> renderizar a view index, usando os
// dados do banco de dados "data/jogadores.json" com a lista de jogadores
app.get('/', (request, response) => {
  response.render('index', {
    players: db.jogadores.players
  })
})


// EXERCÍCIO 3
// definir rota para página de detalhes de um jogador --> renderizar a view
// jogador, usando os dados do banco de dados "data/jogadores.json" e
// "data/jogosPorJogador.json", assim como alguns campos calculados
app.get('/jogador/:numero_identificador', (request, response) => {
  const steamid = request.params.numero_identificador

  // Procura o jogador no jogadores.json
  const player = db.jogadores.players.find(p => p.steamid === steamid)

  if (!player) {
    return response.status(404).send('Jogador não encontrado')
  }

  // Pega os jogos do jogador em jogosPorJogador.json
  const dadosDoJogador = db.jogosPorJogador[steamid] || { game_count: 0, games: [] }
  const games = dadosDoJogador.games || []

 

  // Quantidade total de jogos
  const quantidadeJogos = dadosDoJogador.game_count || games.length

  // Quantidade de jogos não jogados (playtime_forever === 0)
  const naoJogados = games.filter(g => (g.playtime_forever || 0) === 0).length

  // Ordena os jogos por tempo de jogo (decrescente)
  const jogosOrdenados = [...games].sort(
    (a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0)
  )

  // Função auxiliar para montar URL da imagem do jogo
  const montarUrlImagem = (game) =>
    `http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`

  // Função auxiliar para converter minutos em horas (inteiro)
  const minutosParaHoras = (minutos) => Math.floor((minutos || 0) / 60)

  // Jogo favorito (mais jogado) - o primeiro da lista ordenada
  let jogoFavorito = null
  if (jogosOrdenados.length > 0) {
    const fav = jogosOrdenados[0]
    jogoFavorito = {
      appid: fav.appid,
      name: fav.name,
      tempoHoras: minutosParaHoras(fav.playtime_forever),
      imgUrl: montarUrlImagem(fav),
      statsUrl: `http://steamcommunity.com/profiles/${steamid}/stats/${fav.appid}`
    }
  }

  // Top 5 jogos mais jogados
  const top5Jogos = jogosOrdenados.slice(0, 5).map(g => ({
    appid: g.appid,
    name: g.name,
    tempoHoras: minutosParaHoras(g.playtime_forever),
    imgUrl: montarUrlImagem(g)
  }))

  response.render('jogador', {
    player,
    quantidadeJogos,
    naoJogados,
    jogoFavorito,
    top5Jogos
  })
})


// EXERCÍCIO 1
// configurar para servir os arquivos estáticos da pasta "client"
app.use(express.static(path.join(__dirname, '..', 'client')))


// abrir servidor na porta 3000 (constante PORT)
app.listen(PORT, () => {
  console.log(`Servidor escutando em http://localhost:${PORT}/`)
})