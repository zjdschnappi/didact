/** 
 *  createElement函数
 *  render函数
 *  Fiber structure
 *          root
 *           ||
 *    child  || return                                   
 *           ||      
 *           ||      
 *           ||      
 *           ||        sibling
 *           || ------------------
 *           div                      span
 *           || ------------------ 
 *           ||        sibling
 *           ||      
 *     child || return      
 *           ||      
 *           ||      
 *           ||
 *           ||
 *          span
 *    Fiber {
 *                type:'',
 *                dom:xx,
 *                props:{},
 *                child:Fiber,
 *                sibling:Fiber,
 *                return:Fiber
 *                    
 *          }
 *  reconciliation
 *  requestIdleCallback
 *  commitWork
 *  hooks
 *  Didact.render(<App/>,document.getElementById('root'))
 */
const TEXT_ELEMENT = 'TEXT_ELEMENT'
function DidactFactory(){
  let inProgressRoot = null
  let nextUnitOfWork = null
  let currentRoot = null
  let deletions = []
 
  
  function createDom(fiber){
      const {type,props={}} = fiber
      const dom = type===TEXT_ELEMENT?document.createTextNode(''):document.createElement(type);
      Object.keys(props).filter(isEvent).forEach(item=>{
        dom.addEventListener(item.substring(2).toLowerCase(),props[item])
      })
      Object.keys(props).filter(isProperty).forEach(item=>{
        dom[item] = props[item]
      })
      return dom
  }
  function updateDom(dom,nextProps,prevProps){


      Object.keys(prevProps).filter(isEvent).forEach(item=>{
        dom.removeEventListener(item.substring(2).toLowerCase(),prevProps[item])
      })
      Object.keys(prevProps).filter(isProperty).forEach(item=>{
        dom[item] = null
      })
      Object.keys(nextProps).filter(isEvent).forEach(item=>{
        dom.addEventListener(item.substring(2).toLowerCase(),nextProps[item])
      })
      Object.keys(nextProps).filter(isProperty).forEach(item=>{
        dom[item] = nextProps[item]
      })
      
  }
  function useState(initialValue){
    let oldHook = wipFiber?.alternate?.hooks?.[hookIndex]
    let hook = {
      state:oldHook?oldHook.state:initialValue,
      queue:[]
    }
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
      hook.state = action(hook.state)
    })

    const setState=(action)=>{
      hook.queue.push(action)
      inProgressRoot={
        type:currentRoot.type,
        dom:currentRoot.dom,
        props:currentRoot.props,
        alternate: currentRoot
      }

      nextUnitOfWork = inProgressRoot
      deletions = []
    }
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state,setState]
  }
  function render(element,container){
      const {type} = element

      inProgressRoot={
        type,
        dom:container,
        props:{
          children:[element]
        },
        alternate: currentRoot
      }
      deletions=[]
      nextUnitOfWork = inProgressRoot
  }
  // reconciliation函数是决定到底是新增节点 更新节点还是删除节点的地方 给节点打标记
  function reconciliation(fiber,elements){
    //
    let oldFiber = fiber.alternate?.child;
    let index=0;
    let prevSibling = null;
    
    while(index<elements.length||oldFiber){
      let element = elements[index];
      let newFiber = null
      if(element&&oldFiber?.type!==element.type){
        // type不同 替换dom
         newFiber = {
          type:element.type,
          props:element.props,
          dom:null,
          return:fiber,
          sibling:null,
          child:null,
          effectTag: 'PLACEMENT',
          alternate: null
        }
        
      }else if(element&&oldFiber?.type===element.type) {
        // type相同 使用原dom 然后打上更新的标签
        newFiber = {
          type:element.type,
          props:element.props,
          dom:oldFiber.dom,
          return:fiber,
          sibling:null,
          child:null,
          effectTag: 'UPDATE',
          alternate: oldFiber
        }
      }else if(oldFiber&&(!element||element.type!==oldFiber.type)){
          oldFiber.effectTag = 'DELETION';
          deletions.push(oldFiber)
      }
      if(oldFiber){
        oldFiber = oldFiber.sibling
      }
      if(index===0) {
        fiber.child = newFiber
      } else if(element){
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber;
      index++;
    }

  }
  function commitWork(fiber){
    //
    if(!fiber){
      return 
    }
    let domParentFiber = fiber.return
    while (!domParentFiber.dom) {
      domParentFiber = domParentFiber.return
    }
    const domParent = domParentFiber.dom
    if(fiber.effectTag === 'PLACEMENT'){

      if(fiber.return){
        domParent.appendChild(fiber.dom)
      }
    }
    else if(fiber.effectTag==='UPDATE'){
      updateDom(fiber.dom,fiber.alternate.props,fiber.props)
    }
    else if(fiber.effectTag ==='DELETION'){
     
        domParent.removeChild(fiber.dom)
      
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
    
  }
  function commitRoot(){
    //
    deletions.forEach(commitWork)
    commitWork(inProgressRoot.child)
    currentRoot = inProgressRoot
    inProgressRoot = null

  }
  function workLoop(deadline){
    //
    let shouldYield = false;
    while(nextUnitOfWork&&!shouldYield){
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
      shouldYield = deadline.timeRemaining()<1
    }
    if(!nextUnitOfWork&&inProgressRoot){
      console.log(nextUnitOfWork)
      commitRoot()
    }
    requestIdleCallback(workLoop)
  }
  requestIdleCallback(workLoop)

  let hookIndex = 0
  let wipFiber = null
  function updateFunctionComponent(fiber){
      hookIndex = 0
      wipFiber = fiber
      wipFiber.hooks = []
      const children =[fiber.type(fiber.props)]
      reconciliation(fiber,children)
  }
  function updateHostComponent(fiber){
     if (!fiber.dom) {
        fiber.dom = createDom(fiber)
      }
       // 组建出fiber树
    const children = fiber.props.children
    reconciliation(fiber,children)
  }
  function performUnitOfWork(fiber){
    // if (!fiber.dom) {
    //   fiber.dom = createDom(fiber)
    // }
    typeof fiber.type==='string'?updateHostComponent(fiber):
    updateFunctionComponent(fiber)
    // if(fiber.return){
        // 在这appendChild的话相当于遍历到节点才会渲染ui 万一中断ui不完整  找个地方统一提交全部的渲染
        // 我们可以从performUnitWork的遍历过程可以看出 当返回值为null时 说明整棵树遍历结束了 可以提交去渲染dom了
    //   fiber.return.dom.appendChild(fiber.dom)
    // }
   

    // 接下来我们寻找下一个需要执行的工作单元 深度遍历一直按找到child返回child，没找到child就返回sibling，没找到sibling就返回上一层继续找sibling的方式寻找
    let currentRoot = fiber;
    if(currentRoot.child){
      return currentRoot.child;
    }
    while(currentRoot){
      if(currentRoot.sibling){
        return currentRoot.sibling
      }
      currentRoot = currentRoot.return
    }
    
    return null
  }
  function isEvent(key){
    return key.startsWith('on')
  }
  function isProperty(key){
    return key!=='children'&&!isEvent(key)
  }
  /**
   *  createElement('div',{id:'xxx'},'child1','child2')
   */
  function createElement(type,props,...children){
    // [].concat(...children) 有铺平一层的功效 比如children为[[1,2,3]] 则[].concat(...children) 可以返回[1,2,3]
    const rawChildren = children.length?[].concat(...children):[]
    return {
      type,
      props:{
        ...props,
        children:rawChildren.map(item=>{
          return typeof item==='object'?item:createTextElement(item)
        })
      },
     
    }
  }
  function createTextElement(value){

    return {
      type:'TEXT_ELEMENT',
      props:{
        nodeValue:value,
        children:[]
      },
    }
  }


  return {
    render,
    createElement,
    useState
  }
}