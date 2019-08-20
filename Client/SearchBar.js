import React,{Component} from 'react'
import styled from 'styled-components'
import Autocomplete from 'react-autocomplete'
import axios from 'axios'
import { debounce } from 'throttle-debounce'

import {FaSearch} from 'react-icons/fa';
import {Redirect} from 'react-router-dom'
import Button from '@material-ui/core/Button';
import FadeIn from 'react-fade-in';

import Colors from './UI/Colors'

const Searchbox = styled.input`
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    padding: 0.375em 1.5em 0.375em 0.75em;
    border-color: rgb(108, 117, 125);
    border-style: solid;
    border-width: 1px;
    border-radius: 0.25em;
    background-position: right center;
    background-repeat: no-repeat;
    cursor: pointer;
    font-size: 1em;
    outline: currentcolor none medium;
    background-image: none;
    text-align: center;
`

const SearchboxItem = styled.div`
  padding: 0.375em 0.75em;
  background: ${props => (props.isHighlighted ? Colors[3][1] : 'none')};
  cursor: pointer;
  font-size: 14px;
`

const defaultGenes = [
    {label: 'ENSG00000171163', value: 'ENSG00000171163'},
    {label: 'ENSG00000094975', value: 'ENSG00000094975'},
    {label: 'ENSG00000135845', value: 'ENSG00000135845'},
    {label: 'ENSG00000235492', value: 'ENSG00000235492'},
    {label: 'ZNF692', value: 'ENSG00000171163'},
    {label: 'PCSK9', value: 'ENSG00000169174'}
]

class SearchBar extends Component {

    constructor (props) {
        super(props)
        this.state = {
            redirect: '',
            isHidden: true,
            suggestions: defaultGenes
        }

        this.getSuggestionsDebounce = debounce(
            250,
            this.getSuggestions
        )
    }    

    getSuggestions = value => {

        axios({
            method: "get",
            url: window.location.host + "/api/es/" + value
        }).then(res => {

            if(res.data && res.data.hits && res.data.hits.hits){
                const results = res.data.hits.hits.map(h => {

                    let field

                    for(var prop in h.highlight){
                        field = prop
                        break
                    }

                    let ret = {
                        label: `${h._source[field]} (${h._source["EnsID"]})`,
                        value: h._source.EnsID,
                    }
                    return ret
                })
                this.setState({ suggestions: results })
            }
        })

        console.log("value:", value)
    }

    renderInput = props => {
        const { id } = this.props
        const { ref, ...rest } = props
        return <Searchbox {...rest} id={id} ref={ref} />
    }

    componentDidUpdate() {
        if (this.state.redirect != ''){
            this.setState({
                redirect: '',
            })
        }
    }

    toggleHidden() {
        this.setState({
            isHidden: !this.state.isHidden
        })
    }

    render() {
        if (this.state.redirect != ''){
            return <Redirect push to={'/gene/' + this.state.redirect} />
        }

        if(!this.state.isHidden) {
            return (
                <div>
                    <Button onClick={() => this.toggleHidden()}><FaSearch size={"3em"}/></Button>
                    <FadeIn>
                        <div style={{display: 'inline-block',position: 'absolute', left: '25px', width: '250px', paddingTop: '20px'}}>
                            <Autocomplete
                                getItemValue={(item) => item.value}
                                items={this.state.suggestions}
                                inputProps={{placeholder: "Search by gene"}}
                                renderInput={this.renderInput}
                                renderItem={(item, isHighlighted) =>
                                    <SearchboxItem key={item.label} isHighlighted={isHighlighted}>
                                        {item.label}
                                    </SearchboxItem>
                                }
                                wrapperStyle={{
                                    display: 'inline-block',
                                    width: '100%',
                                }}
                                value={this.state.value}
                                onChange={e => {
                                    let trimVal = e.target.value.trim()
                                    this.setState({ value: trimVal })
                                    if(trimVal){
                                        this.getSuggestionsDebounce(trimVal)
                                    }
                                }}
                                onSelect={gene => {
                                    this.setState({
                                        redirect: gene
                                    })
                                }}
                            />
                        </div>
                    </FadeIn>
                </div>
            )
        } else {
            return(
                <Button onClick={() => this.toggleHidden()}><FaSearch size={"3em"}/></Button>
            );
        }
    }
}



export default SearchBar;