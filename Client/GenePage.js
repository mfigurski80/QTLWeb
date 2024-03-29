import React, { Component } from 'react'
import styled from 'styled-components'
import { debounce } from 'throttle-debounce'

import DatasetFilter from './DatasetFilter'
import GeneCard from './GeneCard'
import GenePageTable from './GenePageTable'
// import GenePageTableFilter from './GenePageTableFilter'
import Legend from './Legend'
import ScatterPlot from './ScatterPlot'
// import TranscriptPlot from './TranscriptPlot'

import { Page } from './UI/BasicElements'
import { Datasets /*, tableCols */ } from './UI/Datasets'

import { extent } from 'd3-array'
import { scaleLinear } from 'd3-scale'

const CardBox = styled.div`
    margin: 10px;
    padding: 0 10px;
    float: left;
`

class GenePage extends Component {

    constructor(props) {
        super(props)

        this.state = {
            genes: [],
            data: [],
            d3WindowData: {},
            mainGeneTranscripts: [],
            filterGene: null,
            filteredData: [],
            isDataLoaded: false,
        }

        this._genePageTable = React.createRef()
        this.filterData = this.filterData.bind(this)
        this.filterDataDB = debounce(
            250,
            this.filterData
        )

    }


    componentDidMount() {
        document.title = "QTL's - " + this.props.geneSymbol
        this.loadAllData()
    }

    componentDidUpdate(prevProps) {
        if (this.props.geneSymbol != prevProps.geneSymbol || prevProps.dataset != this.props.dataset) {
            this.componentDidMount()
        }
    }

    shouldComponentUpdate(prevProps) {
        //this change will always happen by itself
        return prevProps.loading == this.props.loading
    }

    async loadAllData() {
        if (!this.props.loading)
            this.props.setLoadingFunc(true, () => {
                this.props.setDatasetFunc(this.props.dataset)
            })

        const resultsQueryData = await this.getSiteRange(this.props.geneSymbol)
            .then(res => this.loadDataResults(this.props.geneSymbol, res))
        const genes = await this.loadGeneData(resultsQueryData.genes)

        const points = resultsQueryData.fullData.map((p, i) => ({
            position: +p.NonIndexedData.SNPGenomicPosition,
            pvalue: +p.NonIndexedData.pvalue,
            log10pvalue: +p.NonIndexedData.log10pvalue,
            bonfpvalue: +p.NonIndexedData.Bonferronipvalue,
            gene: p.NonIndexedData.GeneSymbol,
            chromosome: p.NonIndexedData.Chromosome,
            bystroId: p.BystroData['gnomad.genomes.id'],
            dataset: p.Dataset,
            fdr: +p.NonIndexedData.FDR,
            index: i,
        }))
        const d3WindowData = await this.loadD3Data(this.props.geneSymbol, points)

        this.setState({
            mainGeneTranscripts: resultsQueryData.mainGeneTranscripts,
            genes,
            data: points,
            filteredData: points,
            d3WindowData,
            isDataLoaded: true,
        })
        this.props.setLoadingFunc(false)

    }


    getSiteRange(symbol) {
        return fetch(`${window.location.origin}/api/gene/${symbol}`)
            .then(res => res.json())
    }

    loadDataResults(geneName, rangeQueryData) {
        const start = Math.min(...rangeQueryData.genes.map(o => +o["knownGene.txStart"]))
        const end = Math.max(...rangeQueryData.genes.map(o => +o["knownGene.txEnd"]))

        return fetch(`${window.location.origin}/api/es/range`, {
            method: 'POST',
            body: JSON.stringify({
                rangeData: {
                    chr: rangeQueryData.genes[0]['knownGene.chrom'],
                    start: start - 100000,
                    end: end + 100000,
                    dataset: Datasets[this.props.dataset].datasets,
                },
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json())
            .then(lines => {
                let fullData = lines.map((x, index) => ({ ...x._source, index }))

                let genes = fullData.map(x => x.NonIndexedData.GeneSymbol)
                genes.push(geneName)

                return {
                    fullData,
                    geneName,
                    genes: [...new Set(genes)],
                    mainGeneTranscripts: rangeQueryData.genes, // intial gene information
                }
            })
    }

    loadGeneData(genes) {
        return fetch(`${window.location.origin}/api/gene/search`, {
            method: 'POST',
            body: JSON.stringify({ knownGenes: genes }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json())
            .then(data => data.genes)
    }


    loadD3Data(gene, points) {

        let axisPadding = { left: 45, top: 40 } // give space for axis numbers/labels
        let padding = { left: 20, top: 20, right: 20, bottom: 60 } // make data stay away from axes
        let width = 1100
        let height = 600

        return {
            axisPadding,
            padding,
            width,
            height,
            gene,
            xScale: scaleLinear()
                .domain(extent(points, d => d.position))
                .range([padding.left + axisPadding.left, width - padding.right]),
            yScale: scaleLinear()
                .domain(extent(points, d => d.log10pvalue))
                .range([height - padding.bottom, padding.top + axisPadding.top]),
            // header: `QTL's - ${this.props.geneSymbol}`,
        }
    }

    // filterResultsFunc = (filterText, cb) => {

    //     this.setState({
    //         filterValue: filterText,
    //     })

    //     this._genePageTable.current.setState({ "highlightIndex": -1 })

    //     let filteredData = this.state.resultsData.fullData

    //     if (filterText) {
    //         filteredData = this.state.resultsData.fullData.filter(
    //             (dataPoint) => {
    //                 if (!filterText) return true

    //                 let filterbool = false
    //                 for (let dataField of tableCols) {

    //                     let value = dataField.dbName(dataPoint)
    //                     if (value && value.toLowerCase().indexOf(filterText.toLowerCase()) > -1) {
    //                         filterbool = true
    //                         break
    //                     }

    //                 }
    //                 return filterbool
    //             }
    //         )

    //         for (let i = 0; i < filteredData.length; i++) {
    //             filteredData[i].filterdIndex = i
    //         }
    //     }

    //     this.setState({
    //         filteredData: filteredData,
    //     }, cb)
    // }

    filterData(gene) {
        this.props.setLoadingFunc(true)

        let filteredData = this.state.data.filter(d => d.gene === gene)
        if (!gene) filteredData = this.state.data

        this.setState({
            filterGene: gene,
            filteredData,
        }, () => this.props.setLoadingFunc(false))
    }

    render() {
        if (!this.state.isDataLoaded) return (<Page />)

        return (
            <Page>
                <CardBox>
                    <GeneCard
                        mainGeneTranscripts={this.state.mainGeneTranscripts} />
                    <DatasetFilter
                        geneSymbol={this.props.geneSymbol}
                        dataset={this.props.dataset}
                        setDatasetFunc={this.props.setDatasetFunc} />
                </CardBox>
                <ScatterPlot
                    header={Datasets[this.props.dataset].displayName}
                    window={this.state.d3WindowData}
                    points={this.state.filteredData}
                    genes={this.state.genes}
                    filterGene={this.state.filterGene}
                    filterResults={this.filterDataDB}
                    genePageTableRef={this._genePageTable}
                />
                <Legend />
                {/* <h3>
                    Filters
                </h3>
                <GenePageTableFilter
                    geneSymbol={this.props.geneSymbol}
                    filterResultsFunc={this.filterResultsFuncDB}
                    filteredData={this.state.filteredData}
                    filterValue={this.state.filterValue}
                /> */}
                <GenePageTable
                    // size={[1100, 500]}
                    ref={this._genePageTable}
                    filterValue={this.state.filterGene}
                    data={this.state.filteredData}
                // dataset={this.props.dataset}
                />
            </Page>
        )
    }
}

export default GenePage