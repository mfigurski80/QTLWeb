import React from 'react'
// import styled from 'styled-components'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

import HomePage from './HomePage'
import GenePage from './GenePage'
import SitePage from './SitePage'
import './Overrides.css';
import SideDrawer from './Drawer'

export default () => (
    <Router>
        <div className={"appContainer"} style = {{
                background: 'linear-gradient(to right,#C3E5E7, #FFFFFF)',
                paddingBottom: '40px'
            }}>
            <SideDrawer/>
            <Switch>
                <Route exact path="/" component={HomePage} />
                <Route exact path="/gene/:geneSymbol/site/:siteValue" 
                    render={
                        ({ match }) => {
                            return (
                                <SitePage geneSymbol={match.params.geneSymbol} siteValue={match.params.siteValue}/>
                            )
                        }
                    }
                />
                <Route exact path="/gene/:geneSymbol" 
                    render={
                        ({ match }) => {
                            return (
                                <GenePage geneSymbol={match.params.geneSymbol}/>
                            )
                        }
                    }
                />
            </Switch>
        </div>
    </Router>
  )