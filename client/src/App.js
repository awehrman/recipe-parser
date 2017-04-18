import React, { Component } from 'react';
import './App.css';
import recipes from '../../data/output/_master.json';
import Scroll from 'react-scroll';

const scroll = Scroll.animateScroll;

class App extends Component {
  constructor() {
    super();

    this.state = {
      currentID: 0,
      currentOrder: 0,
      show: false,
      width: '0',
      height: '0',
      numActiveColumns: 3
    };

    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions.bind(this));
  }

  offset(el) {
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop };
  }

  componentDidUpdate() {
    const rp = document.querySelector('.recipe');

    if (rp !== null) {
      const divOffset = this.offset(rp);
      scroll.scrollTo(divOffset.top);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions.bind(this));
  }

  updateWindowDimensions() {
    let operator = 1; //mobile size 1 img per row

    if (window.innerWidth >= 1000) { //desktop 3 images per row
      operator = 3;
    }

    if (window.innerWidth < 1000 && window.innerWidth >= 600) { //tablet 2 images per row
      operator = 2;
    }

    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
      numActiveColumns: operator
    });
  }

  viewRecipe(recipe, index) {
    this.setState({
      currentID: recipe,
      currentOrder: index * 10,
      show: true
    });
  }

  recipe(rp) {
    let order = 0;

    switch(this.state.numActiveColumns) {
      case 3:
        switch ((this.state.currentOrder / 10) % 3) {
          case 0:
            order = this.state.currentOrder + 25;
            break;
          case 1:
            order = this.state.currentOrder + 15;
            break;
          default:
            order = this.state.currentOrder + 5;
            break;
        }
        break;
      case 2:
        switch ((this.state.currentOrder / 10) % 2) {
          case 1:
            order = this.state.currentOrder + 5;
            break;
          default:
            order = this.state.currentOrder + 15;
            break;
        }
        break;
      default:
        order = (this.state.currentOrder + 5);
        break;
    }

    const orderStyling = {
      order: order
    };

    const recipe = recipes.filter(r => rp === r.id );
    const ingredients = recipe[0].ingredients.map((ing) => {
      return (
        <li>
          <span className="amount">{ ing.amount } </span>
          <span className="unitDesc">{ ing.unitDesc } </span>
          <span className="unit">{ ing.unit } </span>
          <span className="ingredientDesc">{ ing.ingredientDesc } </span>
          { ing.ingredient.map( i => <span className={ (i.validated) ? 'ingredient' : 'unvalidated ingredient' }> { i.name } </span> ) }
          <span className="comment">{ ing.comment } </span>
        </li>
      );
    });
    const instructions = recipe[0].instructions.map((instr) => {
      return <li>{ instr }</li>;
    });


    return (
      <div className="recipe" style={ orderStyling }>
        <h1>{ recipe[0].title }</h1>
        <ul>{ ingredients }</ul>
        <ol>{ instructions }</ol>
        <div><a href="#" alt="recipe source">{ recipe[0].source }</a></div>
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
