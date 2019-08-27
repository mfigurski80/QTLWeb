import React, { Component } from 'react'
import styled from 'styled-components'
import { debounce } from 'throttle-debounce'

import ScatterPlot from './ScatterPlot'
import TranscriptPlot from './TranscriptPlot'
import GenePageTable from './GenePageTable'
import GenePageTableFilter from './GenePageTableFilter'
import GeneCard from './GeneCard'

import {min,max} from 'd3-array'
import {scaleLinear} from 'd3-scale'

const Page = styled.div`
    box-sizing: border-box;
    width: 100%;
    max-width: 1200px;
    padding: 0 30px;
    margin: 0 auto;
    font-size: 16px;
`

class GenePage extends Component {

    constructor(props){
        super(props)

        this.state = {
            geneData: [],
            geneSymbol: this.props.geneSymbol,
            resultsData: {},
            filteredData: {},
            filterValue: ""
          }

        this.filterResultsFuncDB = debounce(
            250,
            this.filterResultsFunc
        )
    }

    componentDidMount() {
        document.title = "QTL's - " + this.props.geneSymbol
        this.loadAllData()
    }

    componentDidUpdate() {
        if(this.props.geneSymbol != this.state.geneSymbol){
            document.title = "QTL's - " + this.props.geneSymbol
            this.loadAllData()
        }
    }

    loadAllData(){
        this.getSiteRange()
        .then( 
            (range) => this.loadDataResults(this.props.geneSymbol,range)
            .then(
                (resultsQueryResults) => {
                    this.loadDataGene(resultsQueryResults.genes, resultsQueryResults.ensGenes)
                    .then(
                        (stateDI) => {this.loadD3Data(resultsQueryResults,stateDI)}
                    )
                    
                }
            )
        )
    }

    getSiteRange(){
        return fetch(
            window.location.origin + '/api/gene/' + this.props.geneSymbol
        ).then(response => response.json())
    }

    loadDataResults(geneSymbol,rangeQueryData) {

        const txStart = Math.min(...rangeQueryData.genes.map(o => parseInt(o["knownGene.txStart"])))
        const txEnd   = Math.max(...rangeQueryData.genes.map(o => parseInt(o["knownGene.txEnd"])))

        return fetch(
            window.location.origin + '/api/es/range',
            { 
                method: "POST",
                body: JSON.stringify({
                    rangeData:{
                        chr: rangeQueryData.genes[0]["knownGene.chrom"],
                        start: txStart - 100000,
                        end: txEnd + 100000,
                    }
                }),
                headers:{
                    'Content-Type': 'application/json'
                }
            }
        )
        .then(response => response.json())
        .then(data => {

            var lines = data.hits.hits

            var fullData = lines.map(x => x._source)
            var pvals = lines.map(x => parseFloat(x._source.NonIndexedData.log10pvalue))
            var genes = lines.map(x => x._source.NonIndexedData.GeneSymbol)
            var ensGenes = lines.map(x => x._source.NonIndexedData.EnsemblGeneID)

            genes.push(geneSymbol)

            return {
                geneName: geneSymbol,
                fullData: fullData,
                pvals: pvals,
                mainGeneTranscripts: rangeQueryData.genes,
                genes: genes.filter( (value, index, self) => (self.indexOf(value) === index)),
                ensGenes: ensGenes.filter( (value, index, self) => (self.indexOf(value) === index)),
                range: {
                    'start':    txStart,
                    'end':      txEnd,
                    'padding':  100000
                },
            }

        })
    }

    loadDataGene(genes, ensGenes) {

        return fetch(
            window.location.origin + '/api/gene/search',
            { 
                method: "POST",
                body: JSON.stringify({
                    ensGenes: ensGenes,
                    knownGenes: genes,
                }),
                headers:{
                    'Content-Type': 'application/json'
                }
            }
        )
            .then(response => response.json())
            .then( data => {

                //Check for no data
                if(data.genes.length > 0){
                    return ({
                        geneData: data.genes,
                        geneDataLoaded: true
                    })
                }
                else{
                    return({
                        geneDataLoaded: false
                    })
                }
            })
    }

    loadD3Data(resultsQueryResults,stateDI){
        if(!resultsQueryResults)
            return

        const size = [1000,400]

        const d3Margin = {top: 10, right: 10, bottom: 40, left: 50},
        d3Width = size[0] - d3Margin.left - d3Margin.right,
        d3Height = size[1] - d3Margin.top - d3Margin.bottom

        let pvals = resultsQueryResults.pvals

        //Calculate here because we need the scale across components
        const d3Min = min(pvals),
        d3Max = max(pvals),
        dataMinSite = resultsQueryResults.range.start - resultsQueryResults.range.padding,
        dataMaxSite = resultsQueryResults.range.end + resultsQueryResults.range.padding

        var d3ScaleX = scaleLinear()
            .domain([Math.max(dataMinSite,0), dataMaxSite])
            .range([0, d3Width])
            .nice()

        var d3ScaleY = scaleLinear()
            .domain([d3Min, d3Max])
            .range([d3Height, 0])     
            .nice()

        var d3Data ={
            min:    d3Min,
            max:    d3Max,
            scaleX: d3ScaleX,
            scaleY: d3ScaleY,
            height: d3Height,
            width:  d3Width,
            margin: d3Margin,
            size: size
        }

        this.setState(
            {
                ...stateDI,
                resultsData:{
                    ...resultsQueryResults,
                    dataLoaded: true,
                    d3Data: d3Data
                },
                filteredData: resultsQueryResults.fullData,
                geneSymbol: this.props.geneSymbol,
                filterValue: ""
            }
        )
    }

    filterDataFields =  [
        {
            fieldName: "GeneSymbol",
            getData: (d) => d.NonIndexedData.GeneSymbol
        },
        {
            fieldName: "EnsID",
            getData: (d) => d.NonIndexedData.EnsemblGeneID
        },
    ]

    filterResultsFunc = (filterText) => {

        let filteredData = this.state.resultsData.fullData.filter(
            (dataPoint) => 
            {
                if(!filterText){
                    return true
                }

                let filterbool = false
                for(let dataField of this.filterDataFields){

                    let value = dataField.getData(dataPoint)
                    if(value && value.toLowerCase().indexOf(filterText.toLowerCase()) > -1){
                        filterbool = true
                        break
                    }
 
                }
                return filterbool
            }
        )

        this.setState({
            filteredData: filteredData,
            filterValue: filterText
        })
    }

    render() {

        console.log("this.state:",this.state)

        if (!this.state.geneDataLoaded){
            return (
                <Page>
                </Page>
            )
        }

        let kgGenes   = []
        let ensGenes  = []

        for(let o of this.state.geneData){
            if(o.track === "ENSGene"){
                ensGenes.push(o)
            }
            else if(o.track === "KnownGene"){
                kgGenes.push(o)
            }
        }

        return (
            <Page>
                <GeneCard
                    mainGeneTranscripts={this.state.resultsData.mainGeneTranscripts}
                    dataset="pqtl"/>
                {/* <ScatterPlot geneData={this.state.geneData} scaleData={} size={[1000,500]}/> */}
                <ScatterPlot size={[1000,400]} 
                    d3Data={this.state.resultsData.d3Data}
                    range={this.state.resultsData.range}
                    geneSymbol={this.state.geneSymbol}
                    dataLoaded={this.state.geneDataLoaded}
                    filteredData={this.state.filteredData} />
                <p>
                    Filters
                </p>
                {/* <TranscriptPlot size={[1000,10]} 
                    header="Ensembl Track"
                    d3Data={this.state.resultsData.d3Data}
                    geneSymbol={this.state.geneSymbol}
                    filterResultsFunc={this.filterResultsFunc}
                    geneData={ensGenes}
                    filterValue={this.state.filterValue}/> */}
                <TranscriptPlot size={[1000,10]} 
                    header="KnownGene Track"
                    d3Data={this.state.resultsData.d3Data}
                    geneSymbol={this.state.geneSymbol}
                    filterResultsFunc={this.filterResultsFunc}
                    geneData={kgGenes}
                    filterValue={this.state.filterValue}/>
                <GenePageTableFilter
                    geneSymbol={this.state.geneSymbol}
                    filterResultsFunc={this.filterResultsFuncDB}
                    filteredData={this.state.filteredData}
                    filterValue={this.state.filterValue}
                    />
                <GenePageTable size={[1000,500]} 
                    filteredData={this.state.filteredData}
                    />
            </Page>
        )
    }
}

export default GenePage;