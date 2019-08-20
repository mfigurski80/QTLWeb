import React, { Component } from 'react';
import styled from 'styled-components'

const TableFilter = styled.input`
    text-align: center;
`

class GenePageTableFilter extends Component {

    constructor(props){
        super(props)

        this.state = {
            filterValue: this.props.filterValue
        }
    }

    componentDidUpdate(prevProps, prevState){
        if(prevProps.filterValue != this.props.filterValue){
            this.setState({
                filterValue: this.props.filterValue
            })
        }
    }
    
    render() {
        return (
            <div>
                <TableFilter 
                    onChange={(e) => {
                        this.setState({
                            filterValue: e.target.value
                        },(prevState, props) => {
                            this.props.filterResultsFunc(this.state.filterValue)
                        })
                    }}
                    value={this.state.filterValue}
                    placeholder='Filter Results'/>
                <GenePageTableDownloadButton 
                    geneSymbol = {this.props.geneSymbol}
                    filteredData = {this.props.filteredData}
                />
            </div>
        );
    }
}

class GenePageTableDownloadButton extends Component {

    constructor(props){
        super(props)
    }

    shouldComponentUpdate(){
        return false
   }

    downloadHander(props) {

        const baseFileName = "QTLWeb_" + this.props.geneSymbol + "_"

        const date = new Date()
        const timestamp = `${date.getFullYear()}_${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}_${date
            .getDate()
            .toString()
            .padStart(2, '0')}_${date
            .getHours()
            .toString()
            .padStart(2, '0')}_${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}_${date
            .getSeconds()
            .toString()
            .padStart(2, '0')}`

        let data = props.filteredData
        var csv = JSON.stringify(props.filteredData)

        const blob = new Blob([csv], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `${baseFileName.replace(/\s+/g, '_')}_${timestamp}.json`)
        link.onClick = () => {
            console.log('revoke')
            URL.revokeObjectURL(url)
            link.remove()
        }
        document.body.appendChild(link)
        link.click()

    }

    render() {
        return (
            <button
                type='file'
                accept='*'
                onClick={() => this.downloadHander(this.props)}
                style = {{float:'right'}}
            > 
                Download
            </button>
        );
    }
}

export default GenePageTableFilter;