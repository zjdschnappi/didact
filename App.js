/** @jsx Didact.createElement */
const Didact = DidactFactory();

const {render,useState} = Didact
let arrs = ['apple','orange','banana','watermelon','strawberry','cherry','pear','pineapple']
const handleClick = ()=>{
  arrs= arrs.filter((item,index)=>index!==arrs.length-1)
  render(
    <Fruits/>,
     document.getElementById('root'))
}
const Fruits = ()=>{
 
  return  <div id='foo' >
  <span id='bar' style="color:red" onClick={handleClick}>
    {arrs.length}
  </span>
  <div><div>{arrs.map(item=><p>{item}</p>)}</div></div>
</div>;
}
const App= ()=>{
  // const arrs = ['apple','orange','banana','watermelon','strawberry','cherry','pear','pineapple']
  // const Dom = ()=> <div id='foo' >
  //                   <span id='bar' style="color:red" onClick={handleClick}>
  //                     {arrs.length}
  //                   </span>
  //                   <div>{arrs.map(item=><p>{item}</p>)}</div>
  //                 </div>;
  // const handleClick = ()=>{
  //   arrs.pop();
  //   render(
  //     Dom(),
  //     document.getElementById('root'))
  // }
  
  
}
 
// class Fruits extends Component{
//   constructor(props){
//     super(props);
//     this.state = {
//       fruits:['apple','orange','banana','watermelon','strawberry','cherry','pear','pineapple']
//     }
//   }
//   handleClick(){
//     this.setState({
//       fruits:this.state.fruits.slice(0,-1)
//     })
//   }
//   render(){
    // return <div id='foo' >
    //         <span id='bar' style="color:red" onClick={this.handleClick.bind(this)}>
    //           {this.state.fruits.length}
    //         </span>
    //         <div>{this.state.fruits.map(item=><p>{item}</p>)}</div>
    //       </div>;
//   }
// }
render(
 <Fruits/>,
  document.getElementById('root'))

