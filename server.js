const express = require('express')
const os = require('os')

const path = require('path')

const mysql = require('mysql')

const app = express()


class Database {
  constructor( config ) {
      this.connection = mysql.createConnection( config )
  }
  query( sql, args ) {
      return new Promise( ( resolve, reject ) => {
          this.connection.query( sql, args, ( err, rows, fields ) => {
              if ( err )
                  return reject( err )
              resolve( rows )
          } )
      } )
  }
  close(rows) {
      return new Promise( ( resolve, reject ) => {
          this.connection.end( err => {
              if ( err )
                  return reject( err )
          } )
          resolve(rows)
      } );
  }
}

const mySqlQuery = (gene) => {

  db = new Database({
    host     : 'genome-mysql.soe.ucsc.edu',
    user     : 'genome',
    port     : '3306',
    database : 'hg19'
  })

  var result = db
    // .query('SELECT * from ensGene where name2 = \'ENSG00000171163\'')

    .query(`SELECT e.name "ensGene.TranscriptID", \
    e.name2 "ensGene.GeneID", \
    e.chrom "ensGene.chrom", \
    e.strand "ensGene.strand", \
    e.txStart "ensGene.txStart", \
    e.txEnd "ensGene.txEnd", \
    e.cdsStart "ensGene.cdsStart", \
    e.cdsEnd "ensGene.cdsEnd", \
    e.exonCount "ensGene.exonCount", \
    e.exonStarts "ensGene.exonStarts", \
    e.exonEnds "ensGene.exonEnds", \
    kte.name "knownToEnsembl.KnownGeneID", \
    kxr.mRNA "knownXref.mRNAID", \
    kxr.spID "knownXref.UniProtProteinAccessionNumber", \
    kxr.spDisplayID "knownXref.UniProtDisplayID", \
    kxr.genesymbol "knownXref.GeneSymbol", \
    kxr.refseq "knownXref.RefSeqID", \
    kxr.protAcc "knownXref.NCBIProteinAccessionNumber", \
    kxr.description "knownXref.Description", \
    kxr.rfamAcc "knownXref.RfamAccessionNumber", \
    kxr.tRnaName "knownXref.NameOfThetRNATrack", \
    kg.name "knownGene.GeneName", \
    kg.chrom "knownGene.chrom", \
    kg.txStart "knownGene.txStart", \
    kg.txEnd "knownGene.txEnd", \
    kg.cdsStart "knownGene.cdsStart", \
    kg.cdsEnd "knownGene.cdsEnd", \
    kg.exonStarts "knownGene.exonStarts", \
    kg.exonEnds "knownGene.exonEnds" \
    FROM hg19.ensGene AS e \
    JOIN hg19.knownToEnsembl AS kte ON kte.value = e.name \
    JOIN hg19.kgXref AS kxr ON kxr.kgID = kte.name \
    JOIN hg19.knownGene AS kg on kg.name = kte.name \
    where kxr.genesymbol = ${mysql.escape(gene)}`)

    // .query('select * from kgXref kgX where kgX.genesymbol = "ZNF692" limit 1')

  result.then(
    () => {console.log("Closed");db.close()}
  )

  return result
}

const publicDir = path.resolve(__dirname, 'dist')
app.use(express.static(publicDir))

app.get('/api/getUsername', (req, res) => res.send({ username: os.userInfo().username }))
app.get('/api/gene/:geneId', (req, res) => {mySqlQuery(req.params.geneId).then(rows => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(
    { 
      genes: rows
    }
  )
})})

app.get('*', (request, response) => {
  response.sendFile(path.join(publicDir,'index.html'))
})

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`))