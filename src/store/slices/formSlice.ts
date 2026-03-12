export const createFormSlice = (set:any)=>({

  leadForm:{
    nome:'',
    telefone:'',
    email:'',
    endereco:'',
    servico:'',
    status:'novo',
    temperatura:'morno',
    valorOrcado:0,
    orcamentoEnviado:false,
    ultimoContato:'',
    proximoContato:'',
    resumo:'',
    observacoes:''
  },

  setLeadForm:(data:any)=>
    set((state:any)=>({
      leadForm:{
        ...state.leadForm,
        ...data
      }
    })),

  resetLeadForm:()=>set({
    leadForm:{
      nome:'',
      telefone:'',
      email:'',
      endereco:'',
      servico:'',
      status:'novo',
      temperatura:'morno',
      valorOrcado:0,
      orcamentoEnviado:false,
      ultimoContato:'',
      proximoContato:'',
      resumo:'',
      observacoes:''
    }
  })

})