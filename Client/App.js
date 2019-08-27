import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

import HomePage from './HomePage'
import GenePage from './GenePage'
import SearchBar from './SearchBar';
import SitePage from './SitePage'
import SideDrawer from './Drawer'
import { ScrollToTop } from './UI/BasicElements'

import './Overrides.css';

class App extends Component {

    constructor(props) {
        super(props)

        this.state = {
            dataset: "pqtl"
        }
    }

    setDatasetFunc = (newDataset) => {
        this.setState({
            dataset: newDataset,
        })
    }

    render() {
        return (
            <Router>
                <ScrollToTop>
                    <div className={"appContainer"} style = {{
                            paddingBottom: '40px',
                            minWidth: "1200px",
                        }}>
                        <SideDrawer/>
                        <SearchBar/>
                        <Switch>
                            <Route exact path="/" component={HomePage} />
                            <Route exact path="/gene/:geneSymbol/site/:site/chr/:chr/dataset/:dataset" 
                                render={
                                    ({ match }) => {
                                        return (
                                            <SitePage 
                                                geneSymbol={match.params.geneSymbol}
                                                site={match.params.site}
                                                chr={match.params.chr}
                                                dataset={match.params.dataset}
                                                />
                                        )
                                    }
                                }
                            />
                            <Route exact path="/gene/:geneSymbol" 
                                render={
                                    ({ match }) => {
                                        return (
                                            <GenePage geneSymbol={match.params.geneSymbol}
                                                dataset={this.state.dataset}
                                                setDatasetFunc={this.setDatasetFunc}/>
                                        )
                                    }
                                }
                            />
                        </Switch>
                    </div>
                    <div id="footer" style={{height:"300px",width:"100%"}}/>
                </ScrollToTop>
            </Router>
          )
    }
}

export default App;