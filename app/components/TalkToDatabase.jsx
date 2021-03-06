import React, { Component } from 'react'
import {Form, FormGroup, Button, ControlLabel, FormControl, ListGroup, ListGroupItem, ProgressBar, ProgressBarProps, Tabs, Tab} from 'react-bootstrap'
import { connect } from 'react-redux'
import SQLForm from './SQLForm'
import PageHeader from './PageHeader'
import styles from '../../assets/css/TalkToDatabase.css'
import BarChart from './BarChart'
import Table from './Table'
import SaveSliceModal from './SaveSliceModal'
import history from '../main'

const pg = require('pg')

class TalkToDatabase extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentDatabaseName: 'video-shopper',
      databases: [],
      currentTablesArray: [],
      currentSQLQuery: "SELECT name, description, price FROM product JOIN review ON product.id = review.product_id WHERE review.stars = '5'",
      currentData: null,
      showModal: false,
      currentSliceName: '',
      client: new pg.Client(`postgres://localhost/video-shopper`),
      rows: [],
      showQueryBox: false,
      activeTab: 'selectDatabase',
      progressbar:{selectDatabase:0, makeQuery:0, sliceName:0}
    }
    this.handleDatabaseChange = this.handleDatabaseChange.bind(this)
    this.handleFindAllTables = this.handleFindAllTables.bind(this)
    this.findAllColumns = this.findAllColumns.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleQuery = this.handleQuery.bind(this)
    this.handleShowModal = this.handleShowModal.bind(this)
    this.handleSaveSlice = this.handleSaveSlice.bind(this)
    this.handleSliceNameChange = this.handleSliceNameChange.bind(this)
    this.handleFindAllDatabases = this.handleFindAllDatabases.bind(this)
    this.createRows = this.createRows.bind(this)
    this.toggleQueryBox = this.toggleQueryBox.bind(this)
    this.handleFindAllDatabases = this.handleFindAllDatabases.bind(this)
    this.createRows = this.createRows.bind(this)
    this.changeTab = this.changeTab.bind(this)
    this.progressBarUpdate = this.progressBarUpdate.bind(this)

  }

  handleChange(event) {
    this.setState({
      currentSQLQuery: event.target.value
    })
  }

  handleSliceNameChange(event) {
    this.setState({
      currentSliceName: event.target.value
    })
  }

//client: new pg.Client(`postgres://localhost/video-shopper`)
  handleDatabaseChange(event) {
        event.preventDefault()

    let dbName = event.target.value;
    console.log("dbName ",dbName)
    this.progressBarUpdate("selectDatabase");
    this.setState({
      currentDatabaseName: dbName,
    }, this.handleFindAllTables);



    // return this.setState({
    //     currentDatabaseName: dbName,
    //     client: new pg.Client(`postgres://localhost/${dbName}`)
    //   })
    // .then((res) => this.handleFindAllTables())
    // .catch(err => console.log(err))


  }


  handleQuery(event) {
    this.state.client.query(this.state.currentSQLQuery, (err, data) => {
      if (err) console.error(err)
      else {
        this.setState({
          currentData: data.rows
         })
        this.progressBarUpdate("makeQuery");
        this.changeTab("sliceName")
        console.log("this.state.progressBar ", this.state.progressbar)
        console.log("this.state.activeTab ", this.state.activeTab)
      }
    })
    event.preventDefault()
  }

  handleFindAllDatabases(event) {
    let array = []
    // let columnNames
    // event.preventDefault()
    const client = new pg.Client(`postgres://localhost/`)
    client.connect()
    client.query("SELECT datname FROM pg_database WHERE datistemplate = false")
    .then(data => {
      data.rows.forEach(x=> {
        array.push(x.datname);
      })
      this.setState({
          databases: array
      }, this.handleFindAllTables)
    })
    .catch(err => console.log(err))
    // this.setState({client})
  };

  handleFindAllTables() {
    let that = this;
    let array = []
    // event.preventDefault()
    const client = new pg.Client(`postgres://localhost/${this.state.currentDatabaseName}`)
    client.connect()
    client.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'public'")
    .then(data => {
      data.rows.forEach(x => {
        that.findAllColumns(x.table_name)
        .then(columnArray => {
          array.push({
            tableName: x.table_name,
            columnNames: columnArray
          })

        })
        .then(() => {
          return this.setState({
            currentTablesArray: array
          })})
        .then(()=> this.createRows())
      })
    })
    .catch(err => console.log(err))
    this.setState({client})
  }

  findAllColumns(tableName) {
    let columnArray = []
    const client = new pg.Client(`postgres://localhost/${this.state.currentDatabaseName}`)
    client.connect()
    let query = "SELECT column_name FROM information_schema.columns WHERE table_name = '" + tableName + "'"
    return client.query(query)
    .then(data => {
      data.rows.forEach(x => {
        columnArray.push(x.column_name)
      })
      return columnArray
    })
    .catch(err => console.log(err))
  }

  handleShowModal() {
    this.setState({
      showModal: true
    })
  }

  handleSaveSlice(event) {
    event.preventDefault()
    this.props.addSlice({
      title: event.target.sliceName.value,
      dateCreated: new Date(),
      SQLQuery: this.state.currentSQLQuery,
      data: this.state.currentData,
      database: this.state.currentDatabaseName
    })
    history.push('/explorer')
  }

  createRows(){
    let rows = this.state.currentTablesArray.map((x)=> {
      return {tableName: x.tableName, columnNames: x.columnNames.join(', ')}
    });
    this.setState({
      rows: rows
    })
  }

  toggleQueryBox(){
    let bool = !this.state.showQueryBox;
    this.setState({
      showQueryBox: bool
    })
  }

  changeTab(tab){
    this.setState({
      activeTab: tab
    })
  }

  progressBarUpdate(key){
    //      progressbar:{selectDatabase:0, makeQuery:0,sliceName:0}
    this.setState({
      progressbar: {
        [key]: 33
      }
    })
  }

  render() {
    if (this.state.databases.length ===0 ) {
      this.handleFindAllDatabases()
    }

    return (

    <div className="container-fluid">
     <Tabs defaultActiveKey="selectDatabase" id="sqlab" pullLeft justified onSelect={this.changeTab} activeKey={this.state.activeTab}>
      <Tab eventKey="selectDatabase" title="Choose Database"></Tab>
      <Tab eventKey="makeQuery" title="Filter Data"></Tab>
      <Tab eventKey="sliceName" title="Save Data Slice"></Tab>
      </Tabs>
      <br/><br/><br/>

     <ProgressBar>
      <ProgressBar label='Choose a Database' bsStyle="success" now={this.state.progressbar.selectDatabase} key={1} />
      <ProgressBar label='Filter Data' bsStyle="warning" now={this.state.progressbar.makeQuery} key={2} />
      <ProgressBar label='Save Data Slice' active bsStyle="info" now={this.state.progressbar.sliceName} key={3} />
    </ProgressBar>
            {
              this.state.activeTab === 'selectDatabase' &&
              <FormGroup controlId="formControlsSelect">
              <ControlLabel>Select a Database</ControlLabel>
              <FormControl componentClass="select" placeholder="select" onChange={this.handleDatabaseChange}>
              {
              this.state.databases && this.state.databases.map((databaseName,i)=>{
                return <option key = {databaseName} value={databaseName}>{databaseName}</option>
              })
              }
              </FormControl>
            </FormGroup>

            }

            {
            this.state.activeTab == 'makeQuery' &&
            <Table columns = {['tableName', 'columnNames']} rows = {this.state.rows} tableName={`Tables in ${this.state.currentDatabaseName}`}/> &&
            <div className ="row">
            <form onSubmit={
              this.handleQuery}>
            <FormGroup controlId="formsControlTextarea">
                  <ControlLabel>Enter SQL Query: </ControlLabel>
                  <FormControl
                    componentClass="textarea"
                    style={{height: '100px'}}
                    placeholder="Enter SQL Query here: " value={this.state.currentSQLQuery}
                    onChange={this.handleChange} />
                </FormGroup>
                <Button bsStyle="primary" type='submit' className='pull-right' style={{marginBottom:"10px"}}>
                  Filter Data
                </Button>
              </form>
              </div>
            }
              <div>   {
              ((this.state.activeTab === 'selectDatabase' || this.state.activeTab== "makeQuery") && this.state.rows.length>0) &&
            <Table columns = {['tableName', 'columnNames']} rows = {this.state.rows} tableName={`Tables in ${this.state.currentDatabaseName}`}/>
              }
            </div>

            {
            (this.state.activeTab =='sliceName' && this.state.currentData) &&
            <Table columns = { Object.keys(this.state.currentData[0]) } rows = {(this.state.currentData) } tableName = { this.state.currentSQLQuery } />
            }

            {
            (this.state.activeTab == 'sliceName' && this.state.currentData) &&
            <Button bsStyle="primary" type='submit' className='pull-right' onClick={ (event) => {
              this.progressBarUpdate('sliceName');
              this.props.setCurrentData(this.state.currentData)
              this.handleShowModal()
            }
            }>
              Save Data Slice
            </Button>
            }

            {
              this.state.showModal &&
              <SaveSliceModal handleSaveSlice={ this.handleSaveSlice } handlesaveSliceChange={ this.handleSliceNameChange } />
            }


        </div>

    )
  }
}


// ----------------------- Container -----------------------
import { setCurrentData, addSlice } from '../reducers/dataReducer'

const mapStateToProps = (state, ownProps) => ({
  currentData: state.data.currentData
})

const mapDispatchToProps = dispatch => ({
  setCurrentData: data => dispatch(setCurrentData(data)),
  addSlice: sliceObj => dispatch(addSlice(sliceObj))
})

export default connect(mapStateToProps, mapDispatchToProps)(TalkToDatabase)


//  <div className="row">
//         <div className="col-sm-3">
//          <ListGroup >
//           <ListGroupItem onClick={()=>this.changeTab('selectDatabase')} className={this.state.activeTab == "selectDatabase" ? "active" : ""} >Choose Database</ListGroupItem>
//           <ListGroupItem onClick={()=>this.changeTab('makeQuery')} className={this.state.activeTab == "makeQuery" ? "active" : ""} >Filter Data
//           </ListGroupItem>
//           <ListGroupItem onClick={()=>this.changeTab('saveSlice')} className={this.state.activeTab == "saveSlice" ? "active" : ""} >Save Slice
//           </ListGroupItem>
//         </ListGroup>
//         </div>

//         <div className="col-sm-9">

//  <SQLForm {...this.state} handleChange = { this.handleChange } handleQuery = { this.handleQuery }/>
