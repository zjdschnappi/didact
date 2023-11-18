/**  
 * 1. rendering Dom elements
 * 2. element creation an JSX
 * 3. instances and reconciliation and Virtual Dom
 * 4. components and state
 * 5. Fiber incremental reconciliation
 */
function DidactFactory(){
    const TEXT_ELEMENT = 'TEXT_ELEMENT';
    let rootInstance = null;
    function render(element, container){
      
        const instance = reconciliation(container,rootInstance,element);
        rootInstance = instance
      
    }
    function createPublicInstance(element,internalInstance){
      const {type,props} = element
      const publicInstance = new type(props);
      publicInstance.__internalInstance = internalInstance;
      return publicInstance
    }
    function reconciliation(parentDom,instance,element){
      if(!instance){
        const newInstance = instantial(element);
        parentDom.appendChild(newInstance.dom);
        return newInstance
      }
      else if(!element){ 
        parentDom.removeChild(instance.dom);
        return null
      }
      else if(element.type!==instance.element.type) {
        // 类型不同的情况 需要直接替换
        const newInstance = instantial(element);
        parentDom.replaceChild(newInstance.dom,instance.dom);
        return  newInstance
        

      }
      else if(typeof element.type ==='string'){
        // 原生标签的情况
        updateDomProperties(instance.dom,instance.element.props,element.props);
        instance.childInstances = childrenReconciliation(instance, element);
        instance.element = element;
        return instance;
      }
      else {
       // 自定义组件的情况
        instance.publicInstance.props = element.props;
        const childElement = instance.publicInstance.render();
        const oldChildInstance = instance.childInstance;
        const newChildInstance = reconciliation(parentDom,oldChildInstance,childElement);
        const dom = newChildInstance.dom;
        Object.assign(instance,{dom,element,childInstance:newChildInstance});
        return instance
      }
    }
    function updateDomProperties(dom,prevProps,nextProps){
        const isProperty = (key)=>key!=='children';
        const isEvent = (key)=>key.startsWith('on');
        if(!dom) return 
        const propsKeys=Object.keys(nextProps);
        propsKeys?.filter(item=>isProperty(item)&&!isEvent(item))?.forEach(key=>{
            dom[key]=null
          
        });
        propsKeys?.filter(item=>isProperty(item)&&!isEvent(item))?.forEach(key=>{
            dom[key]=nextProps[key]
          
        });
        propsKeys?.filter(isEvent)?.forEach(key=>{
          const eventType = key.toLowerCase().substring(2);
          dom.removeEventListener(eventType,prevProps[key]);
        })
        propsKeys?.filter(isEvent)?.forEach(key=>{
          const eventType = key.toLowerCase().substring(2);
          dom.addEventListener(eventType,nextProps[key]);
        })
       
    }
   
    function instantial(element){
        const {type,props={}} = element
        if(typeof type ==='string'){
          const isTextNode = type===TEXT_ELEMENT;
          const dom = isTextNode? document.createTextNode(''):document.createElement(type);
          updateDomProperties(dom,{},props)
          const childInstances = (props.children||[]).map(instantial);
          childInstances.forEach(item=>dom.appendChild(item.dom));
          return {dom,element,childInstances}

        }else {
          const instance = {};
          const publicInstance = createPublicInstance(element,instance);
          const childElement = publicInstance.render();
          const childInstance = instantial(childElement);
          const dom = childInstance.dom;
          Object.assign(instance,{dom,element,childInstance,publicInstance});
          return instance
        }
    }
    function childrenReconciliation(instance,element){
      const prevChildrenInstance = instance?.childInstances||[]
      const nextChildrenElement = element.props?.children||[];
      const newChildInstances = [];
      const count = Math.max(prevChildrenInstance.length,nextChildrenElement.length)
      for(let i=0;i<count;i++){
        const childInstance = prevChildrenInstance[i];
        const childElement = nextChildrenElement[i];
        const newChildInstance = reconciliation(instance.dom,childInstance,childElement);
        if(newChildInstance)newChildInstances.push(newChildInstance);
      }
      return newChildInstances

    }
    function createElement(type,config,...children){
      const props = Object.assign({}, config);
      const hasChildren = children.length > 0;
      const rawChildren = hasChildren ? [].concat(...children) : [];
      return {
        type,
        props:{
          ...props,
          children:rawChildren?.filter(c => c != null && c !== false)?.map(item=>item instanceof Object ?item:createTextElement(item))||[]
        }
      }
    }
    function createTextElement(value){
      return createElement(TEXT_ELEMENT, { nodeValue: value });
    }
    function updateInstance(internalInstance) {
      const parentDom = internalInstance.dom.parentNode;
      const element = internalInstance.element;
      reconciliation(parentDom, internalInstance, element);
    }
    class Component {
      constructor(props) {
        this.props = props;
        this.state = this.state || {};
      }
      __internalInstance=null;
      setState(partialState) {
        this.state = Object.assign({}, this.state, partialState);
        updateInstance(this.__internalInstance);
      }
    }
    return {
      createElement,
      render,
      Component
    }
}

window.DidactFactory = DidactFactory
