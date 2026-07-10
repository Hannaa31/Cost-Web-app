import React from 'react';
import DomainWorkspace from '../components/DomainWorkspace';

const ElectricalWorkspace = () => {
  return (
    <DomainWorkspace
      domain="Electrical"
      title="Electrical Engineering Discipline"
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/30"
      borderColor="border-amber-500"
    />
  );
};

export default ElectricalWorkspace;
