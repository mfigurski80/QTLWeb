import React, { Component } from 'react';
import styled from 'styled-components'

import Colors from './UI/Colors'

const Svg = styled.svg`
    margin: 10px auto;
    display: block;
    cursor: pointer;
`

const TranscriptionRect = styled.rect`
    cursor: pointer;
`


class TranscriptPlot extends Component {

    constructor(props){
        super(props)
    }

    state = {
        resultsData: {
            geneName: ''
        }
    }

    componentDidMount() {
    }

    componentDidUpdate() {
        
    }

    // shouldComponentUpdate(nextProps, nextState){
        //  return (nextProps.geneData != this.props.geneData)
    // }

    handleMouseOver(event) {

        let rect = event.target
        rect.setAttribute('fill',Colors[2][0])
        //Brings svg element to front
        rect.parentNode.append(rect)
    }

    handleMouseOut(event, fillcolor) {

        let rect = event.target
        rect.setAttribute('fill',fillcolor)
    }

    render() {
        let items = []
        if(this.props.geneData){
            for(let gene of this.props.geneData){
                // let starts = Buffer.from( this.props.geneData[gene]["ensGene.txStart"],'utf-8' ).toString()
                let start = gene.start
                // let ends = Buffer.from( this.props.geneData[gene]["ensGene.txEnd"],'utf-8' ).toString()
                let end = gene.end
                let name = gene.name
                let ensID = gene.name

                items.push({
                    name: name,
                    start: start,
                    end: end,
                    ensID: ensID
                })
            }
        }
        
        if(!this.props.d3Data)
            return (<div/>)

        return (
            <div>
                <p>
                    {this.props.header}
                </p>
                <Svg id="TranscriptArea" ref={node => this.node = node}
                    width={this.props.size[0]} height={this.props.size[1]}>
                         <g>
                            <line
                                x1 = {0}
                                x2 = {this.props.size[0]}
                                y1 = {this.props.size[1]/2}
                                y2 = {this.props.size[1]/2}
                                strokeWidth = {1}
                                stroke = {'#bdbdbd'}
                            />
                        </g>
                        <g
                            transform = {'translate(' + this.props.d3Data.margin.left + ',0)'}
                        >
                        {items.map(
                            (item) => {
                                let d3Data = this.props.d3Data
                                let fillcolor = this.props.filterValue == item.ensID ? 'brown' : 'black'

                                return (
                                <TranscriptionRect
                                    height = {this.props.size[1]}
                                    width = {d3Data.scaleX(item.end) - d3Data.scaleX(item.start)}
                                    transform = {'translate(' + d3Data.scaleX(item.start) + ',0)'}
                                    fill = {fillcolor}
                                    key = {item.ensID}
                                    data = {JSON.stringify(item)}
                                    value={item.ensID}
                                    onMouseEnter = {this.handleMouseOver}
                                    onMouseLeave = {(e) => this.handleMouseOut(e,fillcolor)}
                                    onClick={(e) => {this.props.filterResultsFunc(e.target.getAttribute("value"))}}
                                    
                                />
                        )})}
                        </g>
                </Svg>
            </div>
        );
    }
}

export default TranscriptPlot;