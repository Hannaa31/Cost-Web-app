import os
import sys
import pandas as pd

# Ensure we can import database and models from backend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from import_excel_sheets import import_excel_sheets

def create_and_seed_3_departments():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    print("==================================================================")
    print("   ENTERPRISE CPQ - 3 DEPARTMENT EXCEL SEED & IMPORT TOOL")
    print("==================================================================\n")

    # -------------------------------------------------------------------------
    # 1. Mechanical Department Excel
    # -------------------------------------------------------------------------
    mech_file = os.path.join(root_dir, "Mechanical_Department_Input.xlsx")
    print(f"[1/3] Generating Mechanical Department Workbook: {mech_file}")
    
    mech_data = {
        # --- Belt Conveyor Sub-Equipments ---
        "Pulleys": pd.DataFrame([
            {
                "dia x shell thk x lagging x shaft dia": "630 x 16 x Ceramic x 140",
                "Belt Width": "1200 mm",
                "Vendor Name": "Fenner India",
                "Base Rate": 85000,
                "Quote Date": "2024-03-15",
                "Remarks": "Heavy duty drive pulley with diamond ceramic lagging"
            },
            {
                "dia x shell thk x lagging x shaft dia": "500 x 12 x Rubber x 110",
                "Belt Width": "1000 mm",
                "Vendor Name": "David Brown",
                "Base Rate": 62000,
                "Quote Date": "2024-04-10",
                "Remarks": "Tail pulley with 10mm rubber lagging"
            }
        ]),
        "Belts": pd.DataFrame([
            {
                "Spec (Width x Ply x Grade)": "1200 x 4 x M-Grade",
                "Belt Type": "EP-800",
                "Vendor Name": "Continental Belting",
                "Base Rate": 3200,
                "Quote Date": "2024-05-01",
                "Remarks": "Fire resistant mining conveyor belt per meter"
            },
            {
                "Spec (Width x Ply x Grade)": "1000 x 3 x N-Grade",
                "Belt Type": "EP-600",
                "Vendor Name": "Fenner India",
                "Base Rate": 2400,
                "Quote Date": "2024-03-25",
                "Remarks": "General purpose abrasion resistant belt"
            }
        ]),
        "Idlers": pd.DataFrame([
            {
                "dia x len x shaft dia": "133 x 450 x 25",
                "Idler Type": "Troughing Carrying",
                "Vendor Name": "Precismeca",
                "Base Rate": 1850,
                "Quote Date": "2024-04-12",
                "Remarks": "Sealed for life bearings SKF make"
            }
        ]),
        "Skirt Board Assembly": pd.DataFrame([
            {
                "dia x len x spec": "1200mm x 6m x Heavy Duty AR Lined",
                "Application": "Conveyor Loading Zone",
                "Vendor Name": "Elecon Engineering",
                "Base Rate": 125000,
                "Quote Date": "2024-04-01",
                "Remarks": "Includes rubber sealing strips and quick release clamps"
            }
        ]),
        "Belt Cleaners": pd.DataFrame([
            {
                "type x blade x tensioner": "Primary & Secondary x Tungsten Carbide x Spring Loaded",
                "Belt Width": "1200 mm",
                "Vendor Name": "Martin Engineering",
                "Base Rate": 45000,
                "Quote Date": "2024-03-20",
                "Remarks": "Heavy duty scraper set with tungsten carbide tips"
            }
        ]),
        "Motors": pd.DataFrame([
            {
                "power x rpm x eff": "75 kW x 1500 RPM x IE3 Premium Efficiency",
                "Mounting": "Foot Mounted B3",
                "Vendor Name": "Siemens India",
                "Base Rate": 185000,
                "Quote Date": "2024-05-10",
                "Remarks": "IE3 energy efficient induction motor"
            }
        ]),
        "Gearbox": pd.DataFrame([
            {
                "type x ratio x shaft": "Helical Bevel x 25:1 x Solid Shaft Output",
                "Rating": "75 kW Drive",
                "Vendor Name": "SEW Eurodrive",
                "Base Rate": 265000,
                "Quote Date": "2024-04-18",
                "Remarks": "Heavy duty outdoor conveyor gear unit with cooling fan"
            }
        ]),
        "Coupling": pd.DataFrame([
            {
                "type x rating x size": "Fluid Coupling x 100 kW x Size 480",
                "Application": "Motor to Gearbox",
                "Vendor Name": "Voith Turbo",
                "Base Rate": 88000,
                "Quote Date": "2024-03-12",
                "Remarks": "Constant fill fluid coupling with delay chamber"
            }
        ]),
        "Hyd. Thruster": pd.DataFrame([
            {
                "type x drum dia x thrust": "Electro Hydraulic Thruster Brake x 300mm x 50kg Thrust",
                "Application": "Conveyor Holdback/Brake",
                "Vendor Name": "Pethe Industrial",
                "Base Rate": 35000,
                "Quote Date": "2024-02-15",
                "Remarks": "High reliability thruster brake unit"
            }
        ]),
        "Take up components": pd.DataFrame([
            {
                "type x travel x winch": "Gravity Take Up x 6m Travel x Pulley & Frame Package",
                "Application": "Conveyor Tensioning",
                "Vendor Name": "Elecon Engineering",
                "Base Rate": 210000,
                "Quote Date": "2024-04-05",
                "Remarks": "Includes bend pulleys, counterweight frame and safety guides"
            }
        ]),
        "Technological Structures": pd.DataFrame([
            {
                "stand/stringers x decking x frame x fasteners x seal plate": "Stand & Stringers x 3mm Decking Plate x Heavy Frame x High Tensile Fasteners x Rubber Seal Plate",
                "Weight per Meter": "120 kg/m",
                "Vendor Name": "Tata Bluescope",
                "Base Rate": 14500,
                "Quote Date": "2024-04-22",
                "Remarks": "Complete structural package per meter including decking and fasteners"
            }
        ]),
        "Chute Work": pd.DataFrame([
            {
                "sailhard liner x ms plate x contingency x bolt nut": "10mm SAILHARD Liner x 12mm MS Plate x Contingency Structural x Gr 8.8 Bolt Nut",
                "Weight": "1 Ton Lot",
                "Vendor Name": "SAIL Fabrication",
                "Base Rate": 135000,
                "Quote Date": "2024-03-30",
                "Remarks": "High abrasion resistant transfer chute fabricated package per MT"
            }
        ]),
        "Accessories": pd.DataFrame([
            {
                "wire mesh x conveyor hood": "Galvanized Wire Mesh Guard x Color Coated Conveyor Hood",
                "Application": "Conveyor Safety & Weather Protection",
                "Vendor Name": "Interarch Building",
                "Base Rate": 3500,
                "Quote Date": "2024-04-10",
                "Remarks": "Rate per linear meter of conveyor"
            }
        ]),

        # --- Auxiliary Equipment Sub-Equipments ---
        "Hoists & Electric Winches": pd.DataFrame([
            {
                "capacity x lift x speed": "5 Ton x 12m Lift x 6m/min Electric Chain Hoist",
                "Type": "Motorized Trolley Type",
                "Vendor Name": "Indef (Bajaj)",
                "Base Rate": 145000,
                "Quote Date": "2024-04-12",
                "Remarks": "Heavy duty maintenance hoist for transfer tower"
            }
        ]),
        "Divertor gate": pd.DataFrame([
            {
                "type x actuation x liner": "2-Way Flapper x Pneumatic Cylinder x 10mm AR Plate",
                "Chute Size": "1200 x 1200 mm",
                "Vendor Name": "Elecon Engineering",
                "Base Rate": 285000,
                "Quote Date": "2024-03-18",
                "Remarks": "Motorized/Pneumatic divertor gate for stream splitting"
            }
        ]),
        "Road gate": pd.DataFrame([
            {
                "type x size x motor": "Motorized Heavy Duty Road Gate x 1200x1200mm x 1.5kW Drive",
                "Application": "Emergency Cut-off",
                "Vendor Name": "Macmet India",
                "Base Rate": 210000,
                "Quote Date": "2024-02-28",
                "Remarks": "Heavy duty motorized rack and pinion road gate"
            }
        ]),
        "Slide gate": pd.DataFrame([
            {
                "type x size x operation": "Rack & Pinion Slide Gate x 800x800mm x Manual Wheel",
                "Application": "Hopper Outlet Maintenance",
                "Vendor Name": "Macmet India",
                "Base Rate": 75000,
                "Quote Date": "2024-03-10",
                "Remarks": "Manual handwheel operated maintenance slide gate"
            }
        ]),
        "CBMS": pd.DataFrame([
            {
                "system x sensors x interface": "Conveyor Belt Monitoring System x 4 Optical Scanners x Ethernet/IP SCADA Interface",
                "Application": "Real-time Rip & Wear Detection",
                "Vendor Name": "CBGuard Technologies",
                "Base Rate": 450000,
                "Quote Date": "2024-05-01",
                "Remarks": "Complete optical & magnetic belt rip detection system"
            }
        ]),
        "Metal Detector": pd.DataFrame([
            {
                "type x belt width x sensitivity": "Aperture Type x 1400mm Belt x 15mm Ferrous/Non-Ferrous Sensitivity",
                "Application": "Tramp Iron Protection",
                "Vendor Name": "Eriez Magnetics",
                "Base Rate": 320000,
                "Quote Date": "2024-04-15",
                "Remarks": "High sensitivity industrial metal detector with bag marker"
            }
        ]),
        "Coal Sampler": pd.DataFrame([
            {
                "system x cutter x sample size": "Cross Belt Auto Sampler x Primary & Secondary Cutter x 50kg/hr Sample",
                "Standard": "ASTM/ISO Compliant",
                "Vendor Name": "Thermo Fisher Scientific",
                "Base Rate": 1850000,
                "Quote Date": "2024-03-25",
                "Remarks": "Two stage automatic mechanical sampling system"
            }
        ]),
        "Belt Weigher": pd.DataFrame([
            {
                "idlers x load cells x accuracy": "4-Idler Electronic Belt Scale x 4 Hermetic Load Cells x +/- 0.25% Accuracy",
                "Application": "Fiscal / Inventory Weighing",
                "Vendor Name": "Schenck Process",
                "Base Rate": 420000,
                "Quote Date": "2024-04-20",
                "Remarks": "High precision belt scale with microprocessor integrator"
            }
        ]),

        # --- Hopper Above Crusher ---
        "Hopper": pd.DataFrame([
            {
                "capacity x structure x liner": "1 x 500 T x Heavy RCC & Structural Steel Grid x 12mm SAILHARD Lined",
                "Application": "Crusher Feed Hopper",
                "Vendor Name": "L&T Heavy Engineering",
                "Base Rate": 3500000,
                "Quote Date": "2024-04-05",
                "Remarks": "500 Ton capacity surge hopper complete with liners and grid"
            }
        ]),

        # --- Major Equipment Sub-Equipments ---
        "Secondary sizer": pd.DataFrame([
            {
                "capacity x shaft x teeth": "1000/1100 TPH x Twin Shaft Toothed Sizer x Hardfaced Alloy Teeth",
                "Application": "Secondary Crushing",
                "Vendor Name": "MMD Sizers",
                "Base Rate": 18500000,
                "Quote Date": "2024-04-10",
                "Remarks": "Heavy duty mineral sizer complete with drives and fluid couplings"
            }
        ]),
        "Vibrating feeder": pd.DataFrame([
            {
                "capacity x drive x deck": "1000/1100 TPH x Dual Unbalanced Motor Drive x Abrasion Resistant Deck",
                "Application": "Hopper Discharge Feeder",
                "Vendor Name": "Joest India",
                "Base Rate": 2450000,
                "Quote Date": "2024-03-15",
                "Remarks": "Heavy duty electromechanical vibrating feeder"
            }
        ]),
        "Truck Loading system": pd.DataFrame([
            {
                "capacity x hopper x chute": "2 x 150T x Batch Weigh Hopper System x Hydraulic Telescopic Chute",
                "Application": "Automated Truck Dispatch",
                "Vendor Name": "FLSmidth",
                "Base Rate": 14500000,
                "Quote Date": "2024-04-25",
                "Remarks": "Complete dual batch weigh truck loading system"
            }
        ]),
        "Rapid Wagon loading system": pd.DataFrame([
            {
                "silo capacity x gate x hydraulic power": "4000 Ton RCC Silo x Flood Loading Gate x 45kW Hydraulic Power Pack",
                "Application": "Train Rapid Loading (TLO)",
                "Vendor Name": "Elecon Engineering",
                "Base Rate": 33550000,
                "Quote Date": "2024-04-01",
                "Remarks": "Automated train loading station complete mechanical package"
            }
        ]),
        "Stacker cum Reclaimer": pd.DataFrame([
            {
                "capacity x boom x mounting": "4000/4400 TPH x 35m Boom Length x Rail Mounted Sleewing & Luffing",
                "Application": "Stockyard Yard Machine",
                "Vendor Name": "ThyssenKrupp India",
                "Base Rate": 329400000,
                "Quote Date": "2024-03-20",
                "Remarks": "Bucket wheel stacker cum reclaimer complete machine"
            }
        ]),
        "IPC (Skid Mounted System)": pd.DataFrame([
            {
                "capacity x hoppers x feeder": "2000/2200 TPH x 4 x 250T Hopper x Apron Feeder & Secondary Sizer Package",
                "Application": "In-Pit Crushing & Conveying",
                "Vendor Name": "Metso Outotec",
                "Base Rate": 287811000,
                "Quote Date": "2024-04-12",
                "Remarks": "Complete mobile/skid mounted crushing station"
            }
        ]),
        "Shifting of IPC system": pd.DataFrame([
            {
                "system x transport x hydraulics": "Heavy Lifting Skid & Hydraulic Transport Package x 500 Ton Lift Capacity",
                "Application": "In-Pit Station Relocation",
                "Vendor Name": "Mammoet India",
                "Base Rate": 87745655,
                "Quote Date": "2024-02-18",
                "Remarks": "Specialized heavy transport and hydraulic crawling system"
            }
        ]),
        "Workshop": pd.DataFrame([
            {
                "package x cranes x tools": "Conveyor Maintenance Workshop Equipment Package x 10T EOT Crane & Lathe/Drill Machines",
                "Application": "Plant Central Maintenance",
                "Vendor Name": "HMT Machine Tools",
                "Base Rate": 5000000,
                "Quote Date": "2024-03-30",
                "Remarks": "Comprehensive mechanical workshop machinery and EOT crane"
            }
        ])
    }
    with pd.ExcelWriter(mech_file, engine='openpyxl') as writer:
        for sheet_name, df in mech_data.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    print("  -> Created Mechanical workbook successfully!\n")

    # -------------------------------------------------------------------------
    # 2. Electrical Department Excel
    # -------------------------------------------------------------------------
    elec_file = os.path.join(root_dir, "Electrical_Department_Input.xlsx")
    print(f"[2/3] Generating Electrical Department Workbook: {elec_file}")
    
    elec_data = {
        "Transformers": pd.DataFrame([
            {
                "Rating x Voltage Ratio x Cooling": "2.5 MVA x 33kV/415V x ONAN",
                "Transformer Type": "Oil Immersed",
                "Vendor Name": "ABB India",
                "Base Rate": 1850000,
                "Quote Date": "2024-04-05",
                "Remarks": "Copper wound distribution transformer with OLTC"
            },
            {
                "Rating x Voltage Ratio x Cooling": "1.6 MVA x 11kV/415V x ONAN",
                "Transformer Type": "Oil Immersed",
                "Vendor Name": "Schneider Electric",
                "Base Rate": 1250000,
                "Quote Date": "2024-03-20",
                "Remarks": "Low loss Tier-3 energy efficient transformer"
            },
            {
                "Rating x Voltage Ratio x Cooling": "800 kVA x 11kV/415V x AN",
                "Transformer Type": "Dry Type Resin Cast",
                "Vendor Name": "Siemens India",
                "Base Rate": 1450000,
                "Quote Date": "2024-05-02",
                "Remarks": "Indoor substation resin cast dry type"
            }
        ]),
        "Switchgears": pd.DataFrame([
            {
                "Voltage x Fault Rating x Incomer": "33 kV x 25kA x 1250A",
                "Panel Type": "VCB Incomer Panel",
                "Vendor Name": "Siemens India",
                "Base Rate": 950000,
                "Quote Date": "2024-03-15",
                "Remarks": "Indoor vacuum circuit breaker panel with numerical relay"
            },
            {
                "Voltage x Fault Rating x Incomer": "415 V x 50kA x 2500A",
                "Panel Type": "PCC Incomer Panel",
                "Vendor Name": "L&T Electrical",
                "Base Rate": 680000,
                "Quote Date": "2024-04-10",
                "Remarks": "Power control centre with ACB incomer and bus duct"
            },
            {
                "Voltage x Fault Rating x Incomer": "415 V x 50kA x 800A",
                "Panel Type": "MCC Feeder Panel",
                "Vendor Name": "Schneider Electric",
                "Base Rate": 450000,
                "Quote Date": "2024-02-25",
                "Remarks": "Motor control centre drawout type feeder"
            }
        ]),
        "Power Cables": pd.DataFrame([
            {
                "Size x Cores x Insulation": "300 sqmm x 3.5 Core x XLPE",
                "Conductor Type": "Aluminium Armoured",
                "Vendor Name": "Polycab India",
                "Base Rate": 1850,
                "Quote Date": "2024-05-12",
                "Remarks": "11kV HT armoured cable per meter"
            },
            {
                "Size x Cores x Insulation": "185 sqmm x 3.5 Core x XLPE",
                "Conductor Type": "Aluminium Armoured",
                "Vendor Name": "Havells India",
                "Base Rate": 1250,
                "Quote Date": "2024-04-20",
                "Remarks": "1.1kV LT power cable per meter"
            },
            {
                "Size x Cores x Insulation": "16 sqmm x 4 Core x XLPE",
                "Conductor Type": "Copper Armoured",
                "Vendor Name": "Finolex Cables",
                "Base Rate": 650,
                "Quote Date": "2024-03-18",
                "Remarks": "Heavy duty copper control cable per meter"
            }
        ]),
        "Control Panels": pd.DataFrame([
            {
                "PLC Spec x I/O Count x Enclosure": "Siemens S7-1500 x 256 I/O x IP65",
                "System Type": "Redundant PLC Panel",
                "Vendor Name": "Siemens India",
                "Base Rate": 1450000,
                "Quote Date": "2024-04-15",
                "Remarks": "Hot standby redundant PLC system with HMI and UPS"
            },
            {
                "PLC Spec x I/O Count x Enclosure": "Allen Bradley ControlLogix x 128 I/O x IP54",
                "System Type": "Conveyor Automation Panel",
                "Vendor Name": "Rockwell Automation",
                "Base Rate": 1150000,
                "Quote Date": "2024-03-10",
                "Remarks": "Plant wide SCADA integrated control station"
            }
        ])
    }
    with pd.ExcelWriter(elec_file, engine='openpyxl') as writer:
        for sheet_name, df in elec_data.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    print("  -> Created Electrical workbook successfully!\n")

    # -------------------------------------------------------------------------
    # 3. Civil Department Excel
    # -------------------------------------------------------------------------
    civil_file = os.path.join(root_dir, "Civil_Department_Input.xlsx")
    print(f"[3/3] Generating Civil Department Workbook: {civil_file}")
    
    civil_data = {
        "RCC Foundations": pd.DataFrame([
            {
                "Grade x Depth x Rebar Density": "M35 x 3.5m x 120kg/m3",
                "Foundation Type": "Heavy Equipment Foundation",
                "Vendor Name": "L&T Construction",
                "Base Rate": 8500,
                "Quote Date": "2024-04-01",
                "Remarks": "Rate per cu.m including excavation, shuttering, steel rebar and curing"
            },
            {
                "Grade x Depth x Rebar Density": "M25 x 2.0m x 80kg/m3",
                "Foundation Type": "Conveyor Trestle Foundation",
                "Vendor Name": "Shapoorji Pallonji",
                "Base Rate": 6200,
                "Quote Date": "2024-03-15",
                "Remarks": "Isolated column footing per cu.m"
            },
            {
                "Grade x Depth x Rebar Density": "M40 x 4.5m x 150kg/m3",
                "Foundation Type": "Crusher Building Raft",
                "Vendor Name": "Afcons Infrastructure",
                "Base Rate": 10500,
                "Quote Date": "2024-05-05",
                "Remarks": "High strength raft foundation with waterproofing"
            }
        ]),
        "Structural Steelwork": pd.DataFrame([
            {
                "Section Type x Grade x Fabrication": "ISMB 500 x E250 x Welded & Bolted",
                "Application": "Conveyor Gallery Trestle",
                "Vendor Name": "Tata Bluescope",
                "Base Rate": 98000,
                "Quote Date": "2024-04-18",
                "Remarks": "Rate per MT including epoxy primer and 2 coats polyurethane paint"
            },
            {
                "Section Type x Grade x Fabrication": "Tubular Section x E350 x Prefabricated",
                "Application": "Transfer Tower Structure",
                "Vendor Name": "Jindal Steel & Power",
                "Base Rate": 115000,
                "Quote Date": "2024-03-22",
                "Remarks": "High tensile tubular lattice bridge structure per MT"
            },
            {
                "Section Type x Grade x Fabrication": "ISMC 300 x E250 x Standard",
                "Application": "Equipment Support Grid",
                "Vendor Name": "Steel Authority (SAIL)",
                "Base Rate": 88000,
                "Quote Date": "2024-02-14",
                "Remarks": "Standard structural channel grid per MT"
            }
        ]),
        "Industrial Sheds": pd.DataFrame([
            {
                "Span x Eave Height x Roof Sheeting": "30m x 12m x Galvalume 0.5mm",
                "Shed Structure Type": "PEB Portal Frame Shed",
                "Vendor Name": "Kirby Building Systems",
                "Base Rate": 4500,
                "Quote Date": "2024-05-10",
                "Remarks": "Pre-engineered building structure rate per sq.m floor area"
            },
            {
                "Span x Eave Height x Roof Sheeting": "24m x 9m x Color Coated Steel",
                "Shed Structure Type": "Warehouse Shed",
                "Vendor Name": "Interarch Building",
                "Base Rate": 3800,
                "Quote Date": "2024-04-05",
                "Remarks": "Standard industrial storage shed per sq.m"
            }
        ]),
        "Excavation & Roads": pd.DataFrame([
            {
                "Road Type x Width x Crust Thickness": "Rigid RCC Road x 7.5m x 300mm",
                "Civil Infrastructure": "Heavy Duty Plant Road",
                "Vendor Name": "L&T Construction",
                "Base Rate": 3200,
                "Quote Date": "2024-04-12",
                "Remarks": "Rate per sq.m including DLC sub-base and M40 pavement quality concrete"
            },
            {
                "Road Type x Width x Crust Thickness": "Flexible Bitumen Road x 6.0m x 250mm",
                "Civil Infrastructure": "Peripheral Access Road",
                "Vendor Name": "Dilip Buildcon",
                "Base Rate": 1800,
                "Quote Date": "2024-03-18",
                "Remarks": "Rate per sq.m including WMM and bituminous macadam"
            }
        ])
    }
    with pd.ExcelWriter(civil_file, engine='openpyxl') as writer:
        for sheet_name, df in civil_data.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    print("  -> Created Civil workbook successfully!\n")

    # -------------------------------------------------------------------------
    # 4. Import all 3 into the single database using smart deduplication
    # -------------------------------------------------------------------------
    print("==================================================================")
    print("   IMPORTING ALL 3 WORKBOOKS INTO UNIFIED DATABASE")
    print("==================================================================\n")
    
    print(">>> Seeding Mechanical Department...")
    import_excel_sheets(mech_file)
    
    print(">>> Seeding Electrical Department...")
    import_excel_sheets(elec_file)
    
    print(">>> Seeding Civil Department...")
    import_excel_sheets(civil_file)
    
    print("\n[SUCCESS] All 3 department Excel sheets have been generated and seeded into your database!")

if __name__ == "__main__":
    create_and_seed_3_departments()
