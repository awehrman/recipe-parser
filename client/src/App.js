import React, { Component } from 'react';
import './App.css';
import recipes from '../../data/output/_master.json';

class App extends Component {
  constructor() {
    super();

    this.state = {
      currentID: 0,
      currentOrder: 0,
      show: false,
      width: '0',
      height: '0',
      modOperand: 3
    };

    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions.bind(this));
  }

  updateWindowDimensions() {
    let operator = 1;

    switch(window.innerWidth) {
      case (window.innerWidth >= 1000):
        operator = 3;
        break;
      case (window.innerWidth <= 600 && window.innerWidth > 400):
        operator = 2;
        break;
      case (window.innerWidth <= 400):
        operator = 1;
        break;
      default:
        operator = 1;
        break;
    }

    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
      modOperand: operator
    });
  }

  viewRecipe(recipe, index) {
    console.log('viewing recipe ');
    this.setState({
      currentID: recipe,
      currentOrder: index * 10,
      show: true
    });
  }

  recipe(rp) {
    const recipe = recipes.filter( r => r.id === rp.id);
    let order = 0;

    switch(this.state.currentOrder % this.state.modOperand) {
      case 2:
        order = ((this.state.currentOrder % this.state.modOperand) * 10) + 5;
        break;
      case 1:
        order = (this.state.currentOrder + 15);
        break;
      default:
      order = (this.state.currentOrder + 25);
        break;
    }

    const orderStyling = {
      order: order
    };

    return (
      <div className="recipe" style={ orderStyling }>
        RECIPE PLACEHOLDER
        <h1>{ recipe.title }</h1>
        <ul>{ recipe.ingredients }</ul>
        <ol>{ recipe.instructions }</ol>
        <div><a href="#" alt="recipe source">{ recipe.source }</a></div>
      </div>
    );
  }

  generateRecipeList() {

    return recipes.map((rp, index) => {
      const orderStyling = {
        order: index * 10
      };

      return (
        <a href='#' onClick={ (e) => this.viewRecipe(e.target.id, index) } key={ rp.id } className="cell" style={ orderStyling }>
          <img id={ rp.id } className="responsive-image" src={ './images/' + rp.imgPath } alt={ rp.title } />
          <div id={ rp.id } className="title">{ rp.title }</div>
        </a>
      );
    })
  }

  render() {
    return (
      <div className="container">
        <div className="grid">
          { this.generateRecipeList() }
          { (this.state.show) ? this.recipe(this.state.currentID) : null }
        </div>
      </div>
    );
  }
}

export default App;
