import React, { Component } from 'react'
import { connect } from 'react-redux'
import Chart from './Chart'
import BubbleChart from './BubbleChart'

class HomeView extends Component {
  constructor(props) {
    super(props)
    this.state= {dashboards: props.dashboards}
  }

  render() {
    return (
      <div className="container-fluid">
         <div className="row">
            <div className="container" style={{'height': 'auto', 'width': '100%'}}>
                <div className="col-sm-12 col-md-12 col-lg-12">
                  <BubbleChart />
                </div>
          </div>
        </div>
       </div>
    )
  }
}

// ----------------------- Container -----------------------

const mapStateToProps = (state, ownProps) => ({
  dashboards: state.dashboards.dashboards
})

const mapDispatchToProps = null

export default connect(mapStateToProps, mapDispatchToProps)(HomeView)
